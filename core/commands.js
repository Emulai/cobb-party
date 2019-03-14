const fs = require("fs");
const disciplines = ["Programming", "Modelling", "Texturing", "Audio", "SourceControl"];
let currentMessage = {};

function processCommand(message, client) {
  //Remove command char, '!'
  let command = message.content.substr(1);
  let primaryCommand = command.split(" ")[0];
  let arguments = command.split(" ").slice(1);

  currentMessage = message;

  if (channel('bot-test')) {
    devCommands(arguments, message, client, primaryCommand);
  } else if (channel('bot-commands')) {
    if ((primaryCommand === 'ideas')) {
      ideasCommand(arguments, message);
    } else if (primaryCommand === 'addResource') {
      resourcesCommand(arguments, message);
    } else if (primaryCommand === 'resources') {
      listResourcesCommand(arguments, message);
    } else if (primaryCommand === 'help') {
      helpCommand(arguments, message);
    } else if (primaryCommand === 'multiply') {
      multiplyCommand(arguments, message);
    } else if (primaryCommand === 'role') {
      roleCommand(arguments, message, client);
    } else if (primaryCommand === 'listIdeas') {
      listIdeasCommand(arguments, message, client);
    } else {
      message.channel.send(`Soz fren, don't understand that command! Pls ask for !help if you need it!`);
    }
  }
}

function devCommands(arguments, message, client, primaryCommand) {
  if (primaryCommand === 'removeRole') {
    removeRoleCommand(arguments, message);
  }
}

function channel(target) {
  if (target === 'bot-commands') return (currentMessage.channel.id === '551319956822687770');
  else if (target === 'bot-test') return (currentMessage.channel.id === '516859846809616413');
}

function helpCommand(arguments, message) {
  if (arguments.length > 0) {
    //Give help for specific command
    if (arguments[0] === 'role') {
      message.channel.send('To choose a role, enter `!role role`');
    } else if (arguments[0] === 'ideas') {
      message.channel.send('Type `!ideas This is my idea` so we can see what you think!');
    } else if (arguments[0] === 'addResource') {
      message.channel.send('Type `!addResource [area] [url]`\nAvailable areas are:\n```\n' + disciplines.join('\n') + '```\nFor example: `!addResource Programming google.com`');
    } else if (arguments[0] === 'resources') {
      message.channel.send('Type `!resource [area]` to list available resources\nThe [area] field is optional');
    }
  } else {
    message.channel.send(`These are the available commands:
!role - Allows users to manage their own roles
!ideas - Suggestion box for bot/club improvements!
!addResource - Library of URLs to resources
!resources - List resources in the library
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
              msg += `__Author__: ${suggestion.user}\n`;
              msg += `__Suggestion__:\n ${suggestion.suggestion}\n\n`;
            });
            message.channel.send(msg);
          });
        }
      });
    }
  });
}

function resourcesCommand(arguments, message) {
  if (arguments.length > 0) {

    if (disciplines.includes(arguments[0])) {

      let resourceObject = {};

      const path = `./core/data/resources/${message.guild.name}.json`;

      fs.access(path, err => {
        if (err) {
          //Initial resource file creation
          resourceObject = {
            resourceGroups: [
              {
                discipline: "Programming",
                resources: []
              },
              {
                discipline: "Modelling",
                resources: []
              },
              {
                discipline: "Texturing",
                resources: []
              },
              {
                discipline: "Audio",
                resources: []
              }
            ]
          };
          fs.writeFile(path, JSON.stringify(resourceObject, null, 4), err => {
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
            //Assuming the file exists, load its data
            resourceObject = JSON.parse(data);
            if (!arguments[1].includes('https://') && !arguments[1].includes('http://')) {
              arguments[1] = `https://${arguments[1]}`;
            }
            //Load list of all resources in file to prevent duplicates
            const fileResources = [];
            resourceObject.resourceGroups.forEach(group => {
              if (group.discipline === arguments[0]) {
                group.resources.forEach(resource => {
                  fileResources.push(resource.resource);
                });
              }
            });

            if (!fileResources.includes(arguments[1])) {
              //Add the resource data
              let resource = {
                id: message.author.id,
                user: message.member.displayName,
                resource: arguments[1]
              };
              //Load a list of all disciplines in file
              const fileDisciplines = [];
              resourceObject.resourceGroups.forEach(group => {
                fileDisciplines.push(group.discipline);
              });
              //Check if the requested discipline is in the file list. By this point, it is already a discipline
              //in the array specified at start
              if (!fileDisciplines.includes(arguments[0])) {
                //Add the discipline group
                resourceObject.resourceGroups.push({ discipline: arguments[0], resources: [] });
              }
              //Find the discipline group, and add the resource object
              resourceObject.resourceGroups.forEach(group => {
                if (group.discipline === arguments[0]) {
                  group.resources.push(resource);
                }
              });
              //Write resources to file
              fs.writeFile(path, JSON.stringify(resourceObject, null, 4), (err) => {
                if (err) {
                  console.error(err);
                  return;
                }

                message.channel.send(`Resource added to library! Thanks ${message.member.displayName}!`);
              });
            } else {
              message.channel.send(`Thanks ${message.member.displayName}, but this resource is already in our library!`);
            }
          }
        });
      });
    } else {
      message.channel.send(`Hey ${message.member.displayName}, thanks for adding a resource!
However there's been a small mistake; The second argument needs to be one of the following:
${disciplines.join('\n')}
Thanks!`);
    }

  } else {
    message.channel.send(`Hey ${message.member.displayName}, thanks for adding a resource!
However there's been a small mistake; please try again like this: '!addResource Programming stackoverflow.com'
Thanks!`);
  }
}

function listResourcesCommand(arguments, message) {
  const path = `./core/data/resources/${message.guild.name}.json`;

  //Check resource file exists
  fs.access(path, err => {
    if (err) {
      console.log('Access File Error');
      console.log(err);
      message.channel.send(`Soz fren, no resources have been added!`);
    } else {
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
          console.log('Read File Error');
          console.log(err);
        }

        let resourceObject = JSON.parse(data);
        //Construct a response message based on given discipline and file data
        let msg = `These are posted ${arguments.length > 0 ? `${arguments[0]} ` : ''}resources!\n`;
        if (arguments.length == 0) msg += 'You can filter these with `!resources [area]`\n';
        resourceObject.resourceGroups.forEach(group => {
          if (arguments.length > 0) {
            if (disciplines.includes(arguments[0])) {
              if (group.discipline === arguments[0]) {
                //Print resource in given group
                msg += `${group.discipline}\n`;
                group.resources.forEach(resource => {
                  msg += '<';
                  msg += resource.resource;
                  msg += '>\n';
                });
                msg += '\n';
              }
            } else {
              msg += 'There are no resources of that type\n';
            }
          } else {
            //Print all resources
            msg += `${group.discipline}\n`;
            group.resources.forEach(resource => {
              msg += '<';
              msg += resource.resource;
              msg += '>\n';
            });
            msg += '\n';
          }

        });
        message.channel.send(msg);
      });
    }
  });
}

module.exports = { processCommand };
