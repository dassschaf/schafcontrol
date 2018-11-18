
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
		
		this.name = 'Set library -- Title';
		this.desc = 'Set library provides a variety of functions to set settings for yourself - this particular module provides support to set your custom title';

		this.utilities = require('../include/f.utilities');
		this.dictionary = require('../include/dictionary');
	}
	
	onChat (params)
	{
		// params:
		// [0] int   : player UId
		// [1] string: login
		// [2] string: message
		// [3] bool  : is Command?

		let command = params[2].split(' ');
		let	db = this.db,
			server = this.server,
			utilities = this.utilities;

		if (!params[3])
			return;


		if (command.shift() == '/set')
			if (command.shift() == 'title')
			{
				let title = command.join(' ');
				if (title !== '')
					db.get().collections('players').findOneAndUpdate({login: params[1]}, {$set: {title: title}}, {upsert: true, returnOriginal: false})
					.then(d =>
						{
							let document = d.value;

							let message = utilities.fill(this.dictionary.titlechanged, {title: document.title});

							server.query('ChatSendServerMessageToLogin', [message, document.login]);
						})

				else
					db.get().collections('players').findOne({login: params[1]})
			}
	}
	

}

module.exports = (db, server) =>
{
	return new plugin(db, server);
};