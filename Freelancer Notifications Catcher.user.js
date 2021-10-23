// ==UserScript==

// @name			FreelancerNotificationsCatcher
// @namespace		DevelopmentSimplyPut
// @description		Freelancer Notifications Catcher
// @match			*https://www.freelancer.com/dashboard*
// @require			https://code.jquery.com/jquery-3.3.1.min.js
// @author			Ahmed Tarek Hasan (https://medium.com/@eng_ahmed.tarek)

// ==/UserScript==


const CurrencyConverter = function(apiKey, cachingSpanInMilliseconds) {
	const self = this;

	self.apiKey = apiKey;
	self.cache = {};

	//12 Hours = 43,200,000 Milliseconds
	self.cachingSpanInMilliseconds = cachingSpanInMilliseconds ? cachingSpanInMilliseconds : 43200000;

	return self;
};

CurrencyConverter.prototype.convertCurrency = function(from, to) {debugger;
	const self = this;

	let promise = new Promise((resolve, reject) => {debugger;
		try {debugger;
			if (self.cache.hasOwnProperty(from) && (new Date() - self.cache[from].stamp) < self.cachingSpanInMilliseconds && self.cache[from].conversion[to]) {debugger;
				resolve(self.cache[from].conversion[to]);
			} else {debugger;
				let url = "https://freecurrencyapi.net/api/v2/latest?apikey=" + self.apiKey + "&base_currency=" + from;

				$.ajax({
					url: url,
					method: "GET"
				}).done(response => {debugger;
					self.cache[from] = {
						stamp: new Date(),
						conversion: response.data
					};
					resolve(response.data[to]);
				}).fail(e => {
					debugger;
					resolve("");
				});
			}
		} catch (ex) {debugger;
			resolve("");
		}
	});

	return promise;
};



const Slacker = function(apiToken, channelId, userName, preferredCurrency) {
	const self = this;

	self.apiToken = apiToken;
	self.channelId = channelId;
	self.userName = userName;
	self.preferredCurrency = preferredCurrency;

	return self;
};

Slacker.prototype.slackIt = function(freelancerProject) {
	const self = this;

	let promise = new Promise((resolve, reject) => {
		try {
			let url = freelancerProject.url;

			if (url === "") {
				url = "https://www.freelancer.com/search/projects/?q=" + encodeURI(freelancerProject.title.replace('#', 'Sharp').replace('+', 'Plus'));
			}

			let attachments = [{
				"fallback": freelancerProject.title.replace('#', 'Sharp').replace('+', 'Plus'),
				"color": "#36a64f",
				"pretext": url,
				"fields": [{
						"title": "Title",
						"value": freelancerProject.title.replace('#', 'Sharp').replace('+', 'Plus'),
						"short": false
					},
					{
						"title": "Skills",
						"value": freelancerProject.skills.join(', ').replace('#', 'Sharp').replace('+', 'Plus'),
						"short": false
					}
				],
				"thumb_url": "https://www.freelancer.com/favicon.ico"
			}];

			if (freelancerProject.budgetInPreferredCurrency !== '') {
				attachments[0].fields.push({
					"title": "Budget In " + self.preferredCurrency,
					"value": freelancerProject.budgetInPreferredCurrency.replace('#', 'Sharp').replace('+', 'Plus'),
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

			let message = {
				channel: self.channelId,
				username: self.userName,
				pretty: 1,
				attachments: JSON.stringify(attachments)
			};

			url = "https://slack.com/api/chat.postMessage?" + $.param(message);

			$.ajax({
				url: url,
				method: "POST",
				Contenttype: "application/x-www-form-urlencoded",
				headers: {
					"Authorization": "Bearer " + self.apiToken,
					"Content-type": "application/x-www-form-urlencoded"
				}
			}).done(() => {
				resolve(true);
			}).fail(() => {
				resolve(false);
			});
		} catch (ex) {
			console.log(ex);
			reject(new Error(ex));
		}
	});

	return promise;
};



const Scrapper = function(currencyConverter, preferredCurrency) {
	const self = this;
	
	self.currencyConverter = currencyConverter;
	self.preferredCurrency = preferredCurrency;
	
	return self;
};

Scrapper.prototype.scrap = function(html) {
	const self = this;
	
	let promise = new Promise((resolve, reject) => {
		let result = null;

		try {
			let mainContainer = $(html).find('app-notification-template-project-feed');

			let title = $(mainContainer).find('fl-text:eq(0) div').html().replaceRecurively('<!---->', '').trim();

			let skills = $(mainContainer).find('fl-text:eq(1) div').html().replaceRecurively('<!---->', '')
				.trim()
				.split(',')
				.map(skillText => {
					return skillText.replaceRecurively('<!---->', '').trim().toLowerCase();
				});

			let budgetInLocalCurrency = '';

			if ($(mainContainer).find('fl-budget').html().length > 0) {
				budgetInLocalCurrency = $(mainContainer).find('fl-budget').html().replaceRecurively('<!---->', '').replaceRecurively(",", "").trim();
			}

			let url = "https://www.freelancer.com" + $(html).find('fl-button.ToastContainer a:eq(0)').attr('href');

			let description = "";

			let budgetInPreferredCurrency = "";

			result = new FreelancerProject({
				title: title,
				description: description,
				budgetInPreferredCurrency: budgetInPreferredCurrency,
				budgetInLocalCurrency: budgetInLocalCurrency,
				skills: skills,
				url: url
			});
			
			debugger;
			if (budgetInLocalCurrency !== '' && budgetInLocalCurrency.indexOf(self.preferredCurrency) == -1) {debugger;
				try {
					let reg = /[a-z]+/i;
					let currencyMatches = budgetInLocalCurrency.match(reg);
					let currency = currencyMatches[currencyMatches.length - 1];

					let conversionPromise = self.currencyConverter.convertCurrency(currency, self.preferredCurrency);
					let waitPromise = wait(5000);
					let promises = [conversionPromise, waitPromise];

					Promise.any(promises).then(promiseResult => {debugger;
						if (promiseResult !== true && promiseResult !== "") {debugger;
							let factor = promiseResult;
							let numberPattern = /(?:^|\s)(\d*\.?\d+|\d{1,3}(?:,\d{3})*(?:\.\d+)?)(?!\S)/g;

							let numbers =
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

							result.budgetInPreferredCurrency = budgetInLocalCurrency;

							for (let numIndex = 0; numIndex < numbers.length; numIndex++) {
								result.budgetInPreferredCurrency = result.budgetInPreferredCurrency.replace(numbers[numIndex].trim(), parseFloat(numbers[numIndex].trim()) * parseFloat(factor));
							}
debugger;
							result.budgetInPreferredCurrency = result.budgetInPreferredCurrency.replace(currency, self.preferredCurrency).removeCurrencySymbolsPrefix();
						}
debugger;
						resolve(result);
					});
				} catch {
					resolve(result);
				}
			} else {debugger;
				resolve(result);
			}
		} catch (ex) {
			console.log(ex);
			reject(new Error(ex));
		}
	});

	return promise;
};



const QueueManager = function(slacker, watchInterval) {
	const self = this;

	self.projectsQueue = [];
	self.slacker = slacker;
	self.watchInterval = watchInterval;

	return self;
};

QueueManager.prototype.enqueueProject = function(freelancerProject) {
	const self = this;

	let promise = new Promise((resolve, reject) => {
		try {
			let success = false;

			if (freelancerProject) {
				let found = self.projectsQueue.filter(proj => {
					return proj.isEqual(freelancerProject);
				});

				if (!found || found === null || found.length === 0) {
					self.projectsQueue.push(freelancerProject);
					success = true;
				}
			}

			resolve(success);
		} catch (ex) {
			console.log(ex);
			reject(new Error(ex));
		}
	});

	return promise;
};

QueueManager.prototype.dequeueProject = function() {
	const self = this;

	let promise = new Promise((resolve, reject) => {
		try {
			if (self.projectsQueue.length > 0) {
				let project = self.projectsQueue.shift();

				self.slacker.slackIt(project).then(isDone => {
					if (isDone) {
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
				}).catch(error => {
					console.log(error);
				});
			} else {
				resolve({
					project: null,
					isProcessed: false
				});
			}
		} catch (ex) {
			console.log(ex);
			reject(new Error(ex));
		}
	});

	return promise;
};

QueueManager.prototype.listen = function() {
	const self = this;

	try {
		setInterval(() => {
			try {
				if (self.projectsQueue.length > 0) {
					self.dequeueProject();
				}
			} catch (ex) {
				console.log(ex);
			}
		}, self.watchInterval);
	} catch (ex) {
		console.log(ex);
	}
};



const FreelancerNotificationsWatcher = function(scrapper, freelancerProjectEvaluator, queueManager, watchInterval) {
	const self = this;

	self.scrapper = scrapper;
	self.freelancerProjectEvaluator = freelancerProjectEvaluator;
	self.queueManager = queueManager;
	self.watchInterval = watchInterval;

	return self;
};

FreelancerNotificationsWatcher.prototype.listen = function() {
	try {
		const self = this;

		setInterval(() => {
			try {
				$("fl-card").each((cardIndex, card) => {
					if ($(card).find("app-media-object-content").length > 0) {
						let notification = $(card);

						self.scrapper.scrap($(notification)).then(freelancerProject => {
							self.freelancerProjectEvaluator.evaluate(freelancerProject).then(isEliggible => {
								if (isEliggible) {
									self.queueManager.enqueueProject(freelancerProject).then(() => {
										$(notification).find('fl-button.ToastClose').click();
									}).catch(error => {
										console.log(error);
									});
								}
							}).catch(error => {
								console.log(error);
							});
						}).catch(error => {
							console.log(error);
						});
					}
				});
			} catch (ex) {
				console.log(ex);
			}
		}, self.watchInterval);
	} catch (ex) {
		console.log(ex);
	}
};



const FreelancerProjectEvaluator = function(eligibleSkills) {
	const self = this;

	self.eligibleSkills = eligibleSkills;

	return self;
};

FreelancerProjectEvaluator.prototype.evaluate = function(freelancerProject) {
	const self = this;

	let promise = new Promise((resolve, reject) => {
		let result = false;

		try {
			if (self.eligibleSkills && self.eligibleSkills !== null && self.eligibleSkills.length > 0) {
				if (self.eligibleSkills.length === 1 && self.eligibleSkills[0] === "*") {
					result = true;
				} else {
					for (let i = 0; i < self.eligibleSkills.length; i++) {
						let existing = freelancerProject.skills.filter(skill => {
							return self.eligibleSkills[i].trim().toLowerCase() === skill.trim().toLowerCase();
						});

						if (existing && existing !== null && existing.length > 0) {
							result = true;
							break;
						} else {
							let inlineWords = [].concat(getWordsFromString(freelancerProject.title)).concat(getWordsFromString(freelancerProject.description));

							let existing = inlineWords.filter(inlineWord => {
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
		} catch (ex) {
			console.log(ex);
			reject(new Error(ex));
		}
	});

	return promise;
};



const FreelancerProject = function(params) {
	const self = this;

	if (!params || params === null) {
		params = {};
	}

	self.title = (params.title) ? params.title : '';
	self.description = (params.description) ? params.description : '';
	self.budgetInPreferredCurrency = (params.budgetInPreferredCurrency) ? params.budgetInPreferredCurrency : '';
	self.budgetInLocalCurrency = (params.budgetInLocalCurrency) ? params.budgetInLocalCurrency : '';
	self.skills = (params.skills) ? params.skills : [];
	self.url = (params.url) ? params.url : '';

	return self;
};

FreelancerProject.prototype.isEqual = function(compareTo) {
	let result = false;
	const self = this;

	try {
		if (compareTo) {
			result = (compareTo.title === self.title &&
				compareTo.description === self.description &&
				compareTo.skills.join(', ') === self.skills.join(', ') &&
				compareTo.budgetInPreferredCurrency === self.budgetInPreferredCurrency &&
				compareTo.budgetInLocalCurrency === self.budgetInLocalCurrency);
		}
	} catch (ex) {
		console.log(ex);
	}

	return result;
};



String.prototype.replaceRecurively = function(strToReplace, replaceWith) {
	const self = this;
	let result = self;

	while (result.indexOf(strToReplace) != -1) {
		result = result.replace(strToReplace, replaceWith);
	}

	return result;
};

String.prototype.trimStart = function(strToRemove) {
	const self = this;
	let result = self;

	while (result.length >= strToRemove.length && result.substring(0, strToRemove.length) === strToRemove) {
		result = result.substring(strToRemove.length);
	}

	return result;
};

String.prototype.removeCurrencySymbolsPrefix = function() {
	const self = this;
	let result = self;

	const currencySymbols = ["؋", "դր", "₼", ".د.ب", "৳", "Nu.", "$", "៛", "¥", "£", " ლ", "₹", "Rp", "﷼", "ع.د", "₪", "د.ا", "лв", "د.ك", "₭", "RM", "Rf", "₮", "K", "₨", "₩", "₱", "₽", "NT$", "ЅM", "฿", "₺", "T", "د.إ", "₫", "دج", "Kz", "CFA", "P", "FBu", "FCFA", "CF", "FC", "Fdj", "ናቕፋ", "ብር", "D", "GH₵", "FG", "KSh,", "L", "ل.د", "Ar", "MK", "UM", "DH", "MT", "₦", "FRw", " Db", "Le", "S", "R", "SD", "E", "TSh", "د.ت", "USh", "ZK", "Lek", "€", "դր.", "Br", "KM", "kn", "Kč", "kr.", "EEK", "ლ", "Ft", "kr", "Ls", "CHF", "Lt", "ден", "₤", "zł", "lei", "Дин.", "Sk", "₴", "BZ$", "₡", "RD$", "Q", "G", "J$", "C$", "B/.", "TT$", "$b", "R$", "Gs", "S/.", "$U", "Bs", "WS$", "T$", "VT"];

	for (let i = 0; i < currencySymbols.length; i++) {
		result = result.trimStart(currencySymbols[i]);
	}

	return result;
};



const getWordsFromString = function(str) {
	let words = [];

	str.split(" ").forEach(commaSeparatedWords => {
		commaSeparatedWords.split(",").forEach(rightBracketSeparatedWord => {
			rightBracketSeparatedWord.split(")").forEach(leftBracketSeparatedWord => {
				leftBracketSeparatedWord.split("(").forEach(rightSquareBracketSeparatedWord => {
					rightSquareBracketSeparatedWord.split("[").forEach(leftSquareBracketSeparatedWord => {
						leftSquareBracketSeparatedWord.split("]").forEach(word => {
							word = word.trim();

							if (word & word !== null && word !== "") {
								words.push(word);
							}
						});
					});
				});
			});
		});
	});

	return words;
};

const wait = function(milliseconds) {
	let promise = new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(true);
		}, milliseconds);
	});

	return promise;
};



// Modify the preferred currency as per your own preference
const preferredCurrency = "EUR";

// Modify the filtered Freelancer skills as per your own preferences
const freelancerSkillsToWatch = [
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
	"LINQ",
	"Object Oriented Programming (OOP)",
	"WPF",
	"Windows Desktop",
	"Java",
	"React",
	"HTML",
	"Angular",
	"CSS",
	"Python"
];

// Get your own freecurrencyapi.net API Key
// Caching for 12 Hours = 432,000,00 Milliseconds
const currencyConverter = new CurrencyConverter("lk6f7fd0-277z-12ec-8894-41n9e18q3291", 43200000);

// Get your own Slack Bot Key
// Put in your own Slack channel id
const slacker = new Slacker("xoxb-378377152752-2574471671501-pghLJ7MGiZ9KUKI8YzJQdRN2", "G8XCG0FK5", "Freelancer Notifications Catcher", preferredCurrency);

const queueManager = new QueueManager(slacker, 5000); // WatchInterval is 5000 milliseconds (5 seconds)
const scrapper = new Scrapper(currencyConverter, preferredCurrency);
const freelancerProjectEvaluator = new FreelancerProjectEvaluator(freelancerSkillsToWatch);
const freelancerNotificationsWatcher = new FreelancerNotificationsWatcher(scrapper, freelancerProjectEvaluator, queueManager, 2000); // WatchInterval is 2000 milliseconds (2 seconds)



$(document).ready(() => {
	console.log('Started Freelancer Notifications Catcher');
	freelancerNotificationsWatcher.listen();
	queueManager.listen();
});
