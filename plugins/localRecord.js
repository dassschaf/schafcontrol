// local records handling

class plugin {
	constructor() {

		this.name = 'Local Records';
		this.desc = 'Local Records management plugin';

		this.settings = require('../include/settings');
		this.utilities = require('../include/utilities');
		this.dictionary = require('../include/dictionary');

		this.chalk = require('chalk');

		this.requiredConnections =
			{
				server: true,
				database: true
			};

	}

	onFinish(params) {
		// params:
		// [0] int    : Player UId
		// [1] string : login
		// [2] int    : Time/Score

		let time = params[2],
			login = params[1],
			utilities = this.utilities,
			db = this.conns['db'],
			server = this.conns['server'],
			dictionary = this.dictionary,
			chalk = this.chalk;


		// game occasionally fires a finish event with time == 0, most likely due to restarting the race
		// don't treat this as a valid local record.
		if (time === 0)
			return;


		// get current challenge info for DB queries
		server.query('GetCurrentChallengeInfo', [])
			.then(challenge => {
				let uid = challenge.UId;
				//console.log('Getting UID: ' + uid);
				//console.log('time: ' + time);
				/*
				 * plan:
				 *
				 * 1) update record if it is any better
				 * 2) calculate rank and update rank in record
				 * 3) post message
				 */

				db.collection('records').findOne(
					{
						$and:
							[{ track: uid },
							{ login: login }]
					})
					.then(document => {
						//console.log('Document matching Query:\n' + JSON.stringify(document));

						// absolutely new rec
						if (document === null) {
							// create new record:
							let record =
							{
								track: uid,
								login: login,
								time: time
							};

							db.collection('records').insertOne(record)
								.then(result => {
									//console.log('Insertion result: ' + result);

									// count the documents with a lower time to get the record's place
									db.collection('records').countDocuments({ $and: [{ track: uid }, { time: { $lt: time } }] })
										.then(place => {

											// logically #place must be += 1
											place = place + 1;

											// get player info for the chat message
											server.query('GetPlayerInfo', [login, 1])
												.then(playerInfo => {
													// formatting everything
													let nickname = playerInfo.NickName,
														_time = utilities.calculateTime(time),

														message = utilities.fill(dictionary.localrecord_new, { nickname: nickname, time: _time, place: place });

													// send message + logging
													server.query('ChatSendServerMessage', message);
													console.log(chalk.greenBright('- Running -') + `: [Local Records] - New Local Record (#${place}) by ${login} on ${challenge.Name}; (${time} ms)`);
												})

												.catch(error => {
													console.log(chalk.red('- SERVER ERROR -') + ': ' + error);
												});
										})

										.catch(error => {
											console.log(chalk.red('- DB ERROR -') + ': ' + error);
										});
								})

								.catch(error => {
									console.log(chalk.red('- DB ERROR -') + ': ' + error);
								});
						}

						// no improvement in time
						if (document.time <= time)
							return; //abort!

						// better rec
						if (document.time > time) {
							// better time

							let imp = document.time - time;

							db.collection('records').findOneAndUpdate(
								{
									$and:
										[{ track: uid },
										{ login: login }]
								},

								{
									$set: { time: time }
								},

								{
									returnOriginal: false
								}
							)

								.then(document => {

									db.collection('records').countDocuments({ $and: [{ track: uid }, { time: { $lt: time } }] })
										.then(place => {

											place = place + 1;

											server.query('GetPlayerInfo', [login, 1])
												.then(playerInfo => {
													let nickname = playerInfo.NickName,
														_time = utilities.calculateTime(time),
														improvement = '-' + utilities.calculateTime(imp),

														message = utilities.fill(dictionary.localrecord_imp, { nickname: nickname, time: _time, place: place, imp: improvement });

													server.query('ChatSendServerMessage', message);

													console.log(chalk.greenBright('- Running -') + `: [Local Records] - New Local Record (#${place}) by ${login} on ${challenge.Name}; (${time} ms)`);
												})

												.catch(error => {
													console.log(chalk.red('- SERVER ERROR -') + ': ' + error);
												});
										})

										.catch(error => {
											console.log(chalk.red('- DB ERROR -') + ': ' + error);
										});
								})

								.catch(error => {
									console.log(chalk.red('- DB ERROR -') + ': ' + error);
								});

						}
					})
					.catch(error => {
						console.log(chalk.red('- DB ERROR -') + ': ' + error);
					});

				let obj = this.makeChObj(challenge, 'unknown');

				db.collection('tracks').find({ uid: obj.uid })
					.then(results => {
						if (results.toArray().length === 0)
							db.collection('tracks').find({}).sort({ _id: -1 }).limit(1).toArray((err, res) => {
								obj.nr = res[0].nr + 1;
								db.collection('tracks').findOneAndUpdate({ uid: uid }, { $setOnInsert: obj }, { upsert: true });
							});

						if (results.toArray().length === 1)
							if (results.toArray()[0].nrLaps === -1)
								db.collection('tracks').findOneAndUpdate({ uid: uid }, { $set: obj });

					});
			});



	}

	onChallengeEnd(params) {
		// params:
		// [0] struct : PlayerRankings (SPlayerRankings[])
		// [1] struct : ChallengeInfo  (SChallengeInfo)
		// [2] bool   : Was WarmUp?
		// [3] bool   : Match continues on next map?
		// [4] bool   : Challenge Restart?

		let challenge = params[1],
			ranking = params[0];

		let db = this.conns['db'],
			server = this.conns['server'],
			dictionary = this.dictionary,
			util = this.utilities,
			onlineLogins = [];

		ranking.forEach(elem =>
			{
				onlineLogins.push(elem.Login);
			});

		db.collection('records').aggregate([
			{
				$lookup:
				{
					from: 'tracks',
					local_field: 'login',
					foreign_field: 'nickname',
					as: 'player'
				}
			}
		]).sort({ time: 1 }).toArray((err, res) => {
			if (err) throw err;
			// res is the score result:
			// {time, player: {nickname, login}}

			let mesag;

			mesag = util.fill(dictionary.localrecord_summary_a, { map: challenge.Name, event: "after playing" });

			res.forEach((elem, idx) => {
				// if index > 7 and player isn't on server
				if (index > 7 && onlineLogins.includes(elem.player.login) === false)
					return;

				mesag += util.fill(dictionary.localrecord_summary_elem, { name: elem.player.nickname, time: util.calculateTime(elem.time), nr: idx + 1 });

				if (idx !== res.length - 1)
					mesag += ' - ';
			});

			server.query('ChatSendServerMessage', [mesag]);

		});

	}

	onChallengeBegin(params) {
		// params:
		// [0] struct : ChallengeInfo (SChallengeInfo)
		// [1] bool   : Is WarmUp?
		// [2] bool   : Is Match Coninuation?

		let challenge = params[1];

	}

	makeChObj(challenge, source) {
		let obj =
		{
			name: challenge.Name,
			uid: challenge.UId,
			filename: challenge.FileName,
			author: challenge.Author,
			mood: challenge.Mood,
			medals:
				[
					challenge.AuthorTime,
					challenge.GoldTime,
					challenge.SilverTime,
					challenge.BronzeTime
				],
			coppers: challenge.CopperPrice,
			isMultilap: challenge.LapRace,
			laps: challenge.NbLaps,
			checkpoints: challenge.NbCheckpoints,
			source: source
		};

		return obj;
	}
}

module.exports = new plugin();