
//
// SchafControl sample plugin
//
// it actually doesn't do anything...
//

class plugin
{
	constructor(db, server)
	{
		this.db = db;
		this.server = server;
		
		this.name = 'WinnerCount';
		this.desc = 'Provides stats for count of wins';
		
		this.dictionary = require('../include/dictionary');
		this.utilities = require('../include/f.utilities');
	}
	
	onRaceEnd (params)
	{
		// params:
		// [0] struct : Player Rankings (SPlayerRankings[])
		// [1] struct : Challenge Info (SChallengeInfo)
		
		let ranking = params[0],
			
			db = this.db,
			server = this.server;
		
		if (ranking.length < 2 || ranking[0].BestTime === '-1')
		{
			server.query('ChatSendServerMessage', [this.dictionary.nowinner]);
			return;
		}
		
		let winner = ranking[0];
		
		let login = winner.Login,
			nickname = winner.NickName;
		
		db.get().collection('players').findOneAndUpdate(
			{login: login},
			{$inc: {wins: +1}},
			{
				upsert: true,
				returnOriginal: false
			}
		)
			.then(document =>
			{
				let player = document.value;
				
				let message = this.utilities.fill(this.dictionary.winmessage,
					{
						player: nickname,
						nr: player.wins
					});
				
				server.query('ChatSendServerMessage', [message]);
			});
		
		
	}
	
}

module.exports = (db, server) =>
{
	return new plugin(db, server);
};