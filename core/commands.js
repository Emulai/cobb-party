const fs = require("fs");

function processCommand(message, client) {
  //Remove command char, '!'
  let command = message.content.substr(1);
  let primaryCommand = command.split(" ")[0];
  let arguments = command.split(" ").slice(1);

  if (message.channel.id === "516859846809616413") {
    devCommands(arguments, message, client, primaryCommand);
  }

  if (primaryCommand === 'help') {
    helpCommand(arguments, message);
  } else if (primaryCommand === 'multiply') {
    multiplyCommand(arguments, message);
  } else if (primaryCommand === 'role') {
    roleCommand(arguments, message, client);
  //} else if (/*removeRole*/) {
    //removeRoleCommand()
  } else if (primaryCommand === 'ideas') {
    ideasCommand(arguments, message);
  } else if (primaryCommand === 'listIdeas') {
    listIdeasCommand(arguments, message, client);
  } else {
    message.channel.send(`Soz fren, don't understand that command! Pls ask for !help if you need it!`);
  }
}

function devCommands(arguments, message, client, primaryCommand) {
  if (primaryCommand === 'removeRole') {
    removeRoleCommand(arguments, message);
  }
}

function helpCommand(arguments, message) {
  if (arguments.length > 0) {
    //Give help for specific command
    if (arguments[0] === 'role') {
      message.channel.send('To choose a role, enter `!role role`');
    } else if (arguments[0] === 'ideas') {
      message.channel.send('Type `!ideas This is my idea` so we can see what you think!');
    } else if (arguments[0] === 'multiply') {
      message.channel.send('Try `!multiply 2 4 10`');
    }
  } else {
    message.channel.send(`These are the available commands:
      !role - Allows users to manage their own roles
      !ideas - Suggestion box for bot improvements!
      !multiply - Multiplies given numbers and returns the results
      ...
      To get more help with these commands, enter '!help command'`);
  }
}

function multiplyCommand(arguments, message) {
  if (arguments.length < 2) {
    message.channel.send('Not enough values to multiply! Try `!multiply 2 4 10`');
    return;
  }

  let product = 1;
  arguments.forEach((argument) => {
    product = product * parseFloat(argument);
  });

  message.channel.send(`The product of ${arguments} is:
    ${product.toString()}`);;
}

function roleCommand(arguments, message, client) {
  const botUser = message.guild.fetchMember(client.user).then((user) => {
    const availableRoles = [];
    message.guild.roles.forEach(role => {
      //Only offer roles below bot's roles, and not the default (lowest) role
      if (role.position < user.highestRole.position && role.position != 0) {
        console.log(role.name);
        availableRoles.push(role);
      }
    });

    if (arguments.length > 0) {
      let newRole = null;
      availableRoles.forEach(availableRole => {
        if (availableRole.name === arguments.join(' ')) {
          newRole = availableRole;
        }
      });

      if (newRole !== null) {
        message.member.addRole(newRole.id);
        message.channel.send(`Congratulations ${message.author.toString()}, you now have the ${newRole.name} role!`)
      } else {
        message.channel.send("I can't find that role! Make sure the spelling is correct and try again!");
      }
    } else {
      let msg = 'These are the available roles:\n';

      availableRoles.forEach(role => {
        msg += role.name + '\n';
      });

      msg += 'To choose a role, enter `!role role`';
      message.channel.send(msg);
    }
  });
}

function removeRoleCommand(arguments, message) {

}

function ideasCommand(arguments, message) {
  if (arguments.length > 0) {
    let suggestionObject = {};

    const path = `./core/data/suggestions/${message.guild.name}.json`;

    fs.access(path, err => {
      if (err) {
        suggestionObject = {
          suggestions: []
        };
        fs.writeFile(path, JSON.stringify(suggestionObject, null, 4), err => {
          if (err) {
            console.log(err);
          } else {
            console.log(`${path} created`);
          }
        });
      }

      fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
          console.log(err);
        } else {
          suggestionObject = JSON.parse(data);

          let suggestion = {
            id: message.author.id,
            user: message.member.displayName,
            suggestion: arguments.join(' ')
          };

          if (Object.keys(suggestionObject).length === 0 && suggestionObject.constructor === Object) {
            suggestionObject = {
              suggestions: []
            }
          }

          suggestionObject.suggestions.push(suggestion);

          fs.writeFile(path, JSON.stringify(suggestionObject, null, 4), (err) => {
            if (err) {
              console.error(err);
              return;
            }

            message.channel.send(`Suggestion added to box! Thanks ${message.member.displayName}!`);
          });
        }
      });
    });
  } else {
    message.channel.send(`Hey ${message.member.displayName}, thanks for placing a suggestion!
    However there's been a small mistake; please try again like this: '!ideas This is my idea'
    Thanks!`);
  }
}

function listIdeasCommand(arguments, message, client) {
  const path = `./core/data/suggestions/${message.guild.name}.json`;

  const botUser = message.guild.fetchMember(client.user).then((user) => {
    let permission = false;

    message.guild.roles.forEach(role => {
      //Assumed that roles higher than bot role are Admin, or should be allowed to see suggestions
      if (role.position > user.highestRole.position) {
        permission = true;
      }
    });

    if (permission) {
      fs.access(path, err => {
        if (err) {
          message.channel.send(`Soz fren, there ain't no suggestions yet!`);
        } else {
          fs.readFile(path, 'utf8', (err, data) => {
            let suggestionObject = JSON.parse(data);

            let msg = 'Here are our member suggestions!\n';
            suggestionObject.suggestions.forEach(suggestion => {
              msg += `Author: ${suggestion.user}\n`;
              msg += `Suggestion:\n ${suggestion.suggestion}\n\n`;
            });
            message.channel.send(msg);
          });
        }
      });
    }
  });
}

module.exports = { processCommand };
