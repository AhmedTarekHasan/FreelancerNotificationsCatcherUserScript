// ==UserScript==

// @name          FreelancerNotificationsCatcher

// @namespace     DevelopmentSimplyPut

// @description   Freelancer Notifications Catcher

// @include       *https://www.freelancer.com/*

// @require       https://code.jquery.com/jquery-3.3.1.min.js

// @author        Ahmed Tarek Hasan (https://linkedin.com/in/atarekhasan)

// ==/UserScript==

var queueManager = new QueueManager(5000);
var freelancerNotificationsWatcher = new FreelancerNotificationsWatcher(2000);
var scrapper = new Scrapper();	
var slacker = new Slacker("xoxp-46456854174-274114487095-403432453537-a491760d1899a38239bp572d0ec3cd3c", "G8XCG0FK5", "Freelancer Notifications Catcher");

//var freelancerProjectEvaluator = new FreelancerProjectEvaluator["*"]);
var freelancerProjectEvaluator = new FreelancerProjectEvaluator
([
  "C# Programming",
  ".NET",
  "ASP.NET",
  "MVC",
  "Website Design",
  "ASP",
  "Javascript",
  "SQL",
  "PHP",
  "Graphic Design",
  "AJAX",
  "Visual Basic",
  "CSS",
  "Angular.js",
  "Microsoft Access",
  "Software Testing",
  "C Programming",
  "XML",
  "Windows Desktop",
  "User Interface / IA",
  "node.js",
  "iPhone",
  "WordPress",
  "Silverlight",
  "Visual Basic for Apps",
  "LESS/Sass/SCSS",
  "node.js"
]);



$(document).ready(function(){
  console.log('Started Freelancer Notifications Catcher');
  freelancerNotificationsWatcher.listen();
  queueManager.listen();
});



function FreelancerNotificationsWatcher(watchInterval) {
  var self = this;

  self.watchInterval = watchInterval;

  return self;
};

FreelancerNotificationsWatcher.prototype.listen = function() {
  try {
    var self = this;

    setInterval(function(){
      try {
        $("div.toast.toast-info").each(function(){
          var notification = $(this);

          scrapper.scrap($(notification)).then(function(freelancerProject){
            freelancerProjectEvaluator.evaluate(freelancerProject).then(function(isEliggible){
              if(isEliggible) {
                queueManager.enqueueProject(freelancerProject).then(function(){
                  $(notification).find('button.close.toast-close-button').click();
                }).catch(function(error){ console.log(error); });
              }
            }).catch(function(error){ console.log(error); });
          }).catch(function(error){ console.log(error); });
        });
      }
      catch(ex) {
        console.log(ex);
      }
    }, self.watchInterval);
  }
  catch(ex) {
    console.log(ex);
  }
};



function QueueManager(watchInterval) {
  var self = this;

  self.projectsQueue = [];
  self.watchInterval = watchInterval;

  return self;
};

QueueManager.prototype.enqueueProject = function (freelancerProject) {
  var self = this;

  var promise = new Promise(function(resolve, reject){
    try {
      var success = false;

      if(freelancerProject) {
        var found = self.projectsQueue.filter(function(proj){
          return proj.isEqual(freelancerProject);
        });

        if(!found || found === null || found.length === 0) {
          self.projectsQueue.push(freelancerProject);
          success = true;
        }
      }

      resolve(success);
    }
    catch(ex) {
      console.log(ex);
      reject(new Error(ex));
    }
  });

  return promise;
};

QueueManager.prototype.dequeueProject = function () {
  var self = this;

  var promise = new Promise(function(resolve, reject){
    try {
      if(self.projectsQueue.length > 0) {
        var project = self.projectsQueue.shift();

        slacker.slackIt(project).then(function(isDone) {
          if(isDone) {
            resolve({
              project: project,
              isProcessed: true
            });
          } else {
            self.projectsQueue.push(project);

            resolve({
              project: project,
              isProcessed: false
            });
          }
        }).catch(function(error){ console.log(error); });
      } else {
        resolve({
          project: null,
          isProcessed: false
        });
      }
    }
    catch(ex) {
      console.log(ex);
      reject(new Error(ex));
    }
  });

  return promise;
};

QueueManager.prototype.listen = function () {
  var self = this;

  try {
    setInterval(function(){
      try {
        if(self.projectsQueue.length > 0) {
          self.dequeueProject();
        }
      }
      catch(ex) {
        console.log(ex);
      }
    }, self.watchInterval);
  }
  catch(ex) {
    console.log(ex);
  }
};



function Slacker(apiToken, channelId, userName) {
  var self = this;

  self.apiToken = apiToken;
  self.channelId = channelId;
  self.userName = userName;

  return self;
};

Slacker.prototype.slackIt = function(freelancerProject) {
  var self = this;

  var promise = new Promise(function(resolve, reject) {
    try {
	  var url = freelancerProject.url;
	
	  if(url === "") {
		url = "https://www.freelancer.com/search/projects/?q=" + encodeURI(freelancerProject.title.replace('#', 'Sharp').replace('+', 'Plus'));
	  }
	
      var attachments = [{
        "fallback": freelancerProject.title.replace('#', 'Sharp').replace('+', 'Plus'),
        "color": "#36a64f",
        "pretext": url,
        "fields": [
          {
            "title": "Title",
            "value": freelancerProject.title.replace('#', 'Sharp').replace('+', 'Plus'),
            "short": false
          },
          {
            "title": "Description",
            "value": freelancerProject.description.replace('#', 'Sharp').replace('+', 'Plus'),
            "short": false
          },
          {
            "title": "Skills",
            "value": freelancerProject.skills.join(', ').replace('#', 'Sharp').replace('+', 'Plus'),
            "short": false
          },
          {
            "title": "Budget In USD",
            "value": freelancerProject.budgetInUSD.replace('#', 'Sharp').replace('+', 'Plus'),
            "short": false
          }
        ],
        "thumb_url": "http://example.com/path/to/thumb.png"
      }];

      if (freelancerProject.budgetInLocalCurrency != '') {
        attachments[0].fields.push({
          "title": "Budget In Local Currency",
          "value": freelancerProject.budgetInLocalCurrency.replace('#', 'Sharp').replace('+', 'Plus'),
          "short": false
        });
      }

      var message = {
        token: self.apiToken,
        channel: self.channelId,
        as_user: false,
        username: self.userName,
        pretty: 1,
        attachments: JSON.stringify(attachments)
      };

      var url = "https://slack.com/api/chat.postMessage?" + $.param(message);

      $.ajax({
        url: url,
        method: "POST"
      }).done(function() {
        resolve(true);
      }).fail(function() {
        resolve(false);
      });
    }
    catch(ex) {
      console.log(ex);
      reject(new Error(ex));
    }
  });

  return promise;
};



function FreelancerProjectEvaluator(eligibleSkills) {
  var self = this;

  self.eligibleSkills = eligibleSkills;

  return self;
};

FreelancerProjectEvaluator.prototype.evaluate = function(freelancerProject) {
  var self = this;

  var promise = new Promise(function(resolve, reject){
    var result = false;

    try {
      if (self.eligibleSkills && self.eligibleSkills !== null && self.eligibleSkills.length > 0) {
        if(self.eligibleSkills.length === 1 && self.eligibleSkills[0] === "*") {
          result = true;
        } else {
          for (var i = 0; i < self.eligibleSkills.length; i++) {
            var existing = freelancerProject.skills.filter(function(skill){
              return self.eligibleSkills[i].trim().toLowerCase() === skill.trim().toLowerCase();
            });

            if (existing && existing !== null && existing.length > 0) {
              result = true;
              break;
            }
          }
        }
      }

      resolve(result);
    }
    catch(ex) {
      console.log(ex);
      reject(new Error(ex));
    }
  });

  return promise;
};



function Scrapper() {
  var self = this;
  return self;
};

Scrapper.prototype.scrap = function(html) {
  var promise = new Promise(function(resolve, reject){
    var result = null;

    try {
      var title = $(html).find('.toast-project-title').html().trim();

      var skills = $(html).find('.toast-project-skills').html()
      .trim()
      .split(',')
      .map(function(skillText) {
        return skillText.trim().toLowerCase();
      });

      var description = $(html).find('.toast-project-description').html().trim();
      var budgetInUSD = $(html).find('.notification-project-price:eq(0)').contents().eq(0)[0].data.trim();
      var budgetInLocalCurrency = '';

      if($(html).find('.notification-project-price:eq(0)').find('.notification-project-price').length > 0) {
        budgetInLocalCurrency = $(html).find('.notification-project-price:eq(0)').find('.notification-project-price').html().trim();
      }
	  
	  var url = '';
	  
	  var innderDiv = $(".SettingsWrapper app-project-item app-feed-item a.ButtonElement div.Content div.Inner:contains('" + title+ "')").eq(0);

	  if(innderDiv && innderDiv !== null && innderDiv.length > 0) {
		  var anhor = $(innderDiv).parents("a").eq(0);
		  
		  if(anhor && anhor !== null && anhor.length > 0) {
			url = "https://www.freelancer.com" + $(anhor).attr("href");
		  }
	  }
	  
      result = new FreelancerProject({
        title: title,
        description: description,
        budgetInUSD: budgetInUSD,
        budgetInLocalCurrency: budgetInLocalCurrency,
        skills: skills,
		url : url
      });

      resolve(result);
    }
    catch(ex) {
      console.log(ex);
      reject(new Error(ex));
    }
  });

  return promise;
};



function FreelancerProject(params) {
  var self = this;

  if(!params || params === null) {
    params = {};
  }

  self.title = (params.title) ? params.title : '';
  self.description = (params.description) ? params.description : '';
  self.budgetInUSD = (params.budgetInUSD) ? params.budgetInUSD : '';
  self.budgetInLocalCurrency = (params.budgetInLocalCurrency) ? params.budgetInLocalCurrency : '';
  self.skills = (params.skills) ? params.skills : [];
  self.url = (params.url) ? params.url : '';

  return self;
};

FreelancerProject.prototype.isEqual = function(compareTo) {
  var result = false;

  try {
    if(compareTo) {
      result = (compareTo.title === this.title
                && compareTo.description === this.description
                && compareTo.skills.join(', ') === this.skills.join(', ')
                && compareTo.budgetInUSD === this.budgetInUSD
                && compareTo.budgetInLocalCurrency === this.budgetInLocalCurrency);
    }
  }
  catch(ex) {
    console.log(ex);
  }

  return result;
};