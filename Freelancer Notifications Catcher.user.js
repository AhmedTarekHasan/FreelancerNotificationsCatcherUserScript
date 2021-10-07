// ==UserScript==

// @name			FreelancerNotificationsCatcher
// @namespace			DevelopmentSimplyPut
// @description			Freelancer Notifications Catcher
// @match			*https://www.freelancer.com/dashboard*
// @require			https://code.jquery.com/jquery-3.3.1.min.js
// @author			Ahmed Tarek Hasan (https://linkedin.com/in/atarekhasan)

// ==/UserScript==

var queueManager = new QueueManager(5000);
var freelancerNotificationsWatcher = new FreelancerNotificationsWatcher(2000);
var scrapper = new Scrapper();

// Get your own freecurrencyapi.net API Key
// Caching for 12 Hours = 432,000,00 Milliseconds
var currencyConverter = new CurrencyConverter("lk6f7fd0-277z-12ec-8894-41n9e18q3291", 43200000);

// Get your own Slack Bot Key
// Put in your own Slack channel id
var slacker = new Slacker("xoxb-378377152752-2574471671501-pghLJ7MGiZ9KUKI8YzJQdRN2", "K16GL9SV5B3", "Freelancer Notifications Catcher");

// Modify the filtered Freelancer skills as per your own preferences
var freelancerProjectEvaluator = new FreelancerProjectEvaluator
([
	"ASP",
	"ASP.NET",
	".NET",
	"ADO.NET",
	"C# Programming",
	"Database Development",
	"Database Programming",
	"Typescript",
	"ECMAScript",
	"Grease Monkey",
	"SQL",
	"MVC",
	"Microsoft SQL Server",
	"jQuery / Prototype",
	"Javascript",
	"Angular.js",
	"API",
	"LINQ",
	"node.js",
	"NoSQL Couch &amp; Mongo",
	"OAuth",
	"Object Oriented Programming (OOP)",
	"T-SQL (Transact Structures Query Language)",
	"WPF",
	"Windows Desktop",
	"Silverlight",
	"HTML",
	"PHP",
	"Python",
	"React"
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
        $("fl-card").each(function(){
		  if($(this).find("app-media-object-content").length > 0) {
			  var notification = $(this);

			  scrapper.scrap($(notification)).then(function(freelancerProject){
				freelancerProjectEvaluator.evaluate(freelancerProject).then(function(isEliggible){
				  if(isEliggible) {
					queueManager.enqueueProject(freelancerProject).then(function(){
					  $(notification).find('fl-button.ToastClose').click();
					}).catch(function(error){ console.log(error); });
				  }
				}).catch(function(error){ console.log(error); });
			  }).catch(function(error){ console.log(error); });
		  }
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
          }/*,
          {
            "title": "Description",
            "value": freelancerProject.description.replace('#', 'Sharp').replace('+', 'Plus'),
            "short": false
          }*/,
          {
            "title": "Skills",
            "value": freelancerProject.skills.join(', ').replace('#', 'Sharp').replace('+', 'Plus'),
            "short": false
          }
        ],
        "thumb_url": "https://www.freelancer.com/favicon.ico"
      }];
	  
	  if (freelancerProject.budgetInEUR !== '') {
        attachments[0].fields.push({
          "title": "Budget In EUR",
          "value": freelancerProject.budgetInEUR.replace('#', 'Sharp').replace('+', 'Plus'),
          "short": false
        });
      }
	  
      if (freelancerProject.budgetInLocalCurrency !== '') {
        attachments[0].fields.push({
          "title": "Budget In Local Currency",
          "value": freelancerProject.budgetInLocalCurrency.replace('#', 'Sharp').replace('+', 'Plus'),
          "short": false
        });
      }

      var message = {
        channel: self.channelId,
        username: self.userName,
        pretty: 1,
        attachments: JSON.stringify(attachments)
      };

      var url = "https://slack.com/api/chat.postMessage?" + $.param(message);

      $.ajax({
        url: url,
        method: "POST",
		Contenttype: "application/x-www-form-urlencoded",
		headers: {
			"Authorization": "Bearer " + self.apiToken,
			"Content-type": "application/x-www-form-urlencoded"
		}
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
            } else {
				var inlineWords = [].concat(getWordsFromString(freelancerProject.title)).concat(getWordsFromString(freelancerProject.description));
				
				/*freelancerProject.title.split(" ").forEach(function(mixedWord){
					mixedWord.split(",").forEach(function(word){
						word = word.trim();
						
						if(word !== "" && word !== ",") {
							inlineWords.push(word);
						}
					});
				});
				
				freelancerProject.description.split(" ").forEach(function(mixedWord){
					mixedWord.split(",").forEach(function(word){
						word = word.trim();
						
						if(word !== "" && word !== ",") {
							inlineWords.push(word);
						}
					});
				});*/
				
				var existing = inlineWords.filter(function(inlineWord){
				  return self.eligibleSkills[i].trim().toLowerCase() === inlineWord.trim().toLowerCase();
				});

				if (existing && existing !== null && existing.length > 0) {
				  result = true;
				  break;
				}
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



function getWordsFromString(str) {
	var words = [];
	
	str.split(" ").forEach(function(commaSeparatedWords){
		commaSeparatedWords.split(",").forEach(function(rightBracketSeparatedWord){
			rightBracketSeparatedWord.split(")").forEach(function(leftBracketSeparatedWord){
				leftBracketSeparatedWord.split("(").forEach(function(rightSquareBracketSeparatedWord){
					rightSquareBracketSeparatedWord.split("[").forEach(function(leftSquareBracketSeparatedWord){
						leftSquareBracketSeparatedWord.split("]").forEach(function(word){
							word = word.trim();
			
							if(word & word !== null && word !== "") {
								words.push(word);
							}
						});
					});
				});
			});
		});
	});
	
	return words;
}



function Scrapper() {
  var self = this;
  return self;
};

Scrapper.prototype.scrap = function(html) {
  var promise = new Promise(function(resolve, reject){
    var result = null;

    try {
      var mainContainer = $(html).find('app-notification-template-project-feed');
		
      var title = $(mainContainer).find('fl-text:eq(0) div').html().replaceRecurively('<!---->', '').trim();

      var skills = $(mainContainer).find('fl-text:eq(1) div').html().replaceRecurively('<!---->', '')
      .trim()
      .split(',')
      .map(function(skillText) {
        return skillText.replaceRecurively('<!---->', '').trim().toLowerCase();
      });
	  
	  var budgetInLocalCurrency = '';

      if($(mainContainer).find('fl-budget').html().length > 0) {
        budgetInLocalCurrency = $(mainContainer).find('fl-budget').html().replaceRecurively('<!---->', '').replaceRecurively(",", "").trim();
      }
	  
	  var url = "https://www.freelancer.com" + $(html).find('fl-button.ToastContainer a:eq(0)').attr('href');
	  
	  var description = "";
	  
	  var budgetInEUR = "";
	  
	  result = new FreelancerProject({
		title: title,
		description: description,
		budgetInEUR: budgetInEUR,
		budgetInLocalCurrency: budgetInLocalCurrency,
		skills: skills,
		url : url
	  });
	  
	  if(budgetInLocalCurrency !== '' && budgetInLocalCurrency.indexOf("EUR") == -1) {
		  try {
			var reg = /[a-z]+/i;
			var currencyMatches = budgetInLocalCurrency.match(reg);
			var currency = currencyMatches[currencyMatches.length - 1];
			
			var conversionPromise = currencyConverter.convertCurrency(currency, "EUR");
			var waitPromise = wait(5000);
			var promises = [conversionPromise, waitPromise];

			Promise.any(promises).then(function(promiseResult){
				if(promiseResult !== true && promiseResult !== "") {
					var factor = promiseResult;
					var numberPattern = /(?:^|\s)(\d*\.?\d+|\d{1,3}(?:,\d{3})*(?:\.\d+)?)(?!\S)/g;
					
					var numbers = 
						budgetInLocalCurrency
							.replaceRecurively(">", "")
							.replaceRecurively("<", "")
							.replaceRecurively(",", "")
							.replaceRecurively("  ", " ")
							.trim()
							.removeCurrencySymbolsPrefix()
							.replaceRecurively(" - ", " ")
							.replaceRecurively("-", " ")
							.replaceRecurively("  ", " ")
							.match(numberPattern);
					
					result.budgetInEUR = budgetInLocalCurrency;

					for(var numIndex = 0; numIndex < numbers.length; numIndex++) {
						result.budgetInEUR = result.budgetInEUR.replace(numbers[numIndex].trim(), parseFloat(numbers[numIndex].trim()) * parseFloat(factor));
					}
					
					result.budgetInEUR = result.budgetInEUR.replace(currency, "EUR").removeCurrencySymbolsPrefix();
				}
				
				resolve(result);
			});
		  }
		  catch {
			resolve(result);
		  }
	  } else {
		resolve(result);
	  }
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
  self.budgetInEUR = (params.budgetInEUR) ? params.budgetInEUR : '';
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
                && compareTo.budgetInEUR === this.budgetInEUR
                && compareTo.budgetInLocalCurrency === this.budgetInLocalCurrency);
    }
  }
  catch(ex) {
    console.log(ex);
  }

  return result;
};


function CurrencyConverter(apiKey, cachingSpanInMilliseconds) {
	var self = this;
	
	self.apiKey = apiKey;
	self.cache = {};
	
	//12 Hours = 43,200,000 Milliseconds
	self.cachingSpanInMilliseconds = cachingSpanInMilliseconds ? cachingSpanInMilliseconds : 43200000;
	
	return self;
};

CurrencyConverter.prototype.convertCurrency = function(from, to) {
	var self = this;
	
	var promise = new Promise(function(resolve, reject) {
		try {
			if(self.cache.hasOwnProperty(from) && (new Date() - self.cache[from].stamp) < self.cachingSpanInMilliseconds && self.cache[from].conversion[to]) {
				resolve(self.cache[from].conversion[to]);
			} else {
				var url = "https://freecurrencyapi.net/api/v2/latest?apikey=" + self.apiKey + "&base_currency=" + from;

				$.ajax({
					url: url,
					method: "GET"
				}).done(function(response) {
					self.cache[from] = { stamp: new Date(), conversion: response.data };
					resolve(response.data[to]);
				}).fail(function(e) {
					resolve("");
				});
			}
		}
		catch(ex) {
		  resolve("");
		}
	});

	return promise;
};


function wait(milliseconds) {
	var promise = new Promise(function(resolve, reject) {
		setTimeout(function(){
			resolve(true);
		}, milliseconds);
	});

	return promise;
};


String.prototype.replaceRecurively = function(strToReplace, replaceWith){
	var self = this;
	var result = self;
	
	while(result.indexOf(strToReplace) != -1) {
		result = result.replace(strToReplace, replaceWith);
	}
	
	return result;
};

String.prototype.trimStart = function(strToRemove){
	var self = this;
	var result = self;
	
	while(result.length >= strToRemove.length && result.substring(0, strToRemove.length) === strToRemove) {
		result = result.substring(strToRemove.length);
	}
	
	return result;
};

String.prototype.removeCurrencySymbolsPrefix = function(){
	var self = this;
	var result = self;
	
	var currencySymbols = ["؋", "դր", "₼", ".د.ب", "৳", "Nu.", "$", "៛", "¥", "£", " ლ", "₹", "Rp", "﷼", "ع.د", "₪", "د.ا", "лв", "د.ك", "₭", "RM", "Rf", "₮", "K", "₨", "₩", "₱", "₽", "NT$", "ЅM", "฿", "₺", "T", "د.إ", "₫", "دج", "Kz", "CFA", "P", "FBu", "FCFA", "CF", "FC", "Fdj", "ናቕፋ", "ብር", "D", "GH₵", "FG", "KSh,", "L", "ل.د", "Ar", "MK", "UM", "DH", "MT", "₦", "FRw", " Db", "Le", "S", "R", "SD", "E", "TSh", "د.ت", "USh", "ZK", "Lek", "€", "դր.", "Br", "KM", "kn", "Kč", "kr.", "EEK", "ლ", "Ft", "kr", "Ls", "CHF", "Lt", "ден", "₤", "zł", "lei", "Дин.", "Sk", "₴", "BZ$", "₡", "RD$", "Q", "G", "J$", "C$", "B/.", "TT$", "$b", "R$", "Gs", "S/.", "$U", "Bs", "WS$", "T$", "VT"];
	
	for(var i = 0; i < currencySymbols.length; i++) {
		result = result.trimStart(currencySymbols[i]);
	}
	
	return result;
};
