# Freelancer Notifications Catcher User Script
Get Freelancer.com Filtered by Skills Projects Notifications on Your Slack Channel

<p align="center">
  <img src="https://i.imgur.com/mdflchD.png">
</p>

<br/>

This GreaseMonkey user script watches Freelancer.com projects notifications and sends them to your Slack channel. You can set the skills you are interested in and the script will send you notifications of the projects related to these skills only.

<br/>

## You just need to modify the values below to your proper ones:
* Change **lk6f7fd0-277z-12ec-8894-41n9e18q3291** to your own freecurrencyapi.net API Key
* Change **xoxb-378377152752-2574471671501-pghLJ7MGiZ9KUKI8YzJQdRN2** to your own Slack Bot Key
* Change **K16GL9SV5B3** to your own Slack channel id
* Change Freelancer Notifications Catcher to your preferred Slack bot username
* Change [ "C# Programming", ".NET", "ASP.NET", ... ] to your array of skills. Please note that you should enter skills as they are presented by Freelancer.com

<br/>

## Note:
Due to a problem with Slack API, you might get a CORS error on your browser console leading to a failure in posting projects to Slack. To overcome this problem, you will need to turn off the CORS protection on your web browser. To do so for Chrome, you can create a shortcut to Chrome.exe and modify the target by adding the following parameters:
**--disable-web-security --user-data-dir="C:\Users\{YourUsername}\AppData\Local\Google\Chrome\User Data\"**

<br/>
<br/>

Using GreaseMonkey you can perform so many cool things. If you want to know more about GreaseMonkey, you can check [this article](http://developmentsimplyput.blogspot.com/2013/03/having-fun-with-javascript-and.html)

<br/>

## Related Links:
* [Development Simply Put Blog Post](http://developmentsimplyput.blogspot.com/2013/03/having-fun-with-javascript-and.html)

<br/>

## Authors:
* [Ahmed Tarek Hasan](https://linkedin.com/in/atarekhasan)

