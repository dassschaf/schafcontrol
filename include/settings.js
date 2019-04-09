//
//  SchafControl settings file
//
//  it should be documented...
//

exports.mongodb =
    {
        // MongoDB settings
        //
        // url:
        // MongoDB connection URI, refer to https://docs.mongodb.com/manual/reference/connection-string/
        url: 'mongodb://localhost:27017',

        // options:
        // MongoDB options object
        options:
            {
                poolSize: 10,
                useNewUrlParser: true
            },

        // database:
        db: 'schafcontrol'

    };

exports.server =
    {
        // TrackMania server settings
        //
        // host:
        // The machine your TM server runs on. This is classically localhost.
        host: '127.0.0.1',

        // port:
        // The port your TrackMania server listens at. Usually this is 5001, but varies if you have multiple servers.
        port: 5001,

        // login:
        // The login for the SuperAdmin authorization level.
        login: 'SuperAdmin',

        // password:
        // That very password.
        password: 'sturmabteilung',

        // masterserver_login:
        // The login of your server, which it is registered to at the Master server of TMF.
        masterserver_login: 'ichfahreauto'
    };

exports.masteradmin =
    {
        login: 'papa_tojo',
        
        title: '$o$60Fr$82Ce$A49s$B56i$D73d$F90e$F90n$CA0t $6D0f$3E0o$0F0x'
    };

exports.api =
{
    port: 7886
};