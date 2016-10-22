var util = require('util');
var path = require('path');
var fs = require('fs');
var SlackBot = require('slackbots');
var sqlite = require('sqlite3').verbose();
var file = "attend.db";
var exists = fs.existsSync(file);
var db = new sqlite.Database('./attend.db');
var Promise=require('bluebird');

// create a bot
var bot = new SlackBot({
  token: 'xoxb-90400499799-i8g051kj0eBEk62YoRPiovrc', // Add a bot https://my.slack.com/services/new/bot and put the token
  name: 'AttendBot'
});
var user;
var params = {
  icon_emoji: ':soccer:'
};
bot.on('start', function() {
  // more information about additional params https://api.slack.com/methods/chat.postMessage

  // define channel, where bot exist. You can adjust it there https://my.slack.com/services
  bot.postMessageToChannel('general', 'A Pleasant Day',params);

  db.serialize(function() {
    //db.run("CREATE TABLE IF NOT EXISTS attend (username varchar2,year integer, month integer, day integer,intime varchar,outtime varchar)");
    db.run("delete from attend where username='darshanlila'");
  });
});
bot.on('message', function(data) {
  // all ingoing events https://api.slack.com/rtm
  try{
    if(data.text.toLowerCase().indexOf('\attend') !== -1){
      var username = this.users.filter(function (usr) {
        if(usr.id === data.user){
          return usr.name;
        }
      });
      var text=data.text.replace('\\attend ','');
      bot.postMessageToChannel('attandance','@'+username[0].name+' '+ text,params);
      if(data.text.toLowerCase().indexOf('in') !== -1){
        var lastFive = data.text.toLowerCase().substr(data.text.toLowerCase().length - 5);
        db.serialize(function() {
          var date=new Date();
          //db.run("select * from attend where username="+username[0].name+' and year='+date.getFullYear()+' and month='+date.getMonth()+1+' and day='+day.getDate());
          var year=date.getFullYear();
          var month=date.getMonth()+1;
          var day=date.getDate();
          console.log('before each');
          var userExists = false;
          var call= new Promise(function(resolve,reject){
            db.each("select count(*) from attend where username='"+username[0].name+"' and year="+year+" and month="+month+" and day="+day, function(err, row) {
              console.log('inside');
              userExists = true;
              resolve(true);
            });
          });

          call.then(function(){
            console.log('in then');
            if(userExists==true){
              db.run("update attend set intime='"+lastFive+"' where username='"+username[0].name+"' and year="+year+" and month="+month+" and day="+day);
              console.log('updated');
            }else{
              var insertQuery="INSERT INTO attend(username,year,month,day,intime) VALUES ('"+username[0].name+"',"+year+","+month+","+day+",'"+lastFive+"')";
              db.run(insertQuery);
              console.log('inserted');
            }
          });
        });
      }else if(data.text.toLowerCase().indexOf('out') !== -1){
        console.log('in out');
        var date=new Date();
        var year=date.getFullYear();
        var month=date.getMonth()+1;
        var day=date.getDate();
        var lastFive = data.text.toLowerCase().substr(data.text.toLowerCase().length - 5);
        console.log('serializing now');
        db.serialize(function() {
          console.log('preparing to run out');
          db.run("update attend set outtime='"+lastFive+"' where username='"+username[0].name+"' and year="+year+" and month="+month+" and day="+day);
          console.log('out updated');
        });
      }else if(data.text.toLowerCase().indexOf('my') !== -1){
        db.serialize(function() {
          console.log('preparing to run out');
          var call= new Promise(function(resolve,reject){
            var result=[];
            db.each("select * from attend where username='"+username[0].name+"'", function(err, row) {
              console.log(row);
              result.push(row);
            });
            resolve(result);
          });
          call.then(function(result){
            console.log(username[0].name);
            bot.postMessageToUser(username[0].name, result,params);
          });
        });
      }
    }
  }catch(err){
    console.log(err);
  }
});
console.log('started');
