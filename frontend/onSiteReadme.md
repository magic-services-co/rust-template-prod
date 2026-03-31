# On Site Configuration
- Everything here will be on the [admin dashboard](https://cdn.mrddd.xyz/img/2025/brave_TNMYd4Bs9d) you will see this button after signing in on your admin account.

## 1. Adding your Servers
- Navitage to the Servers tab from the nav on the left -> [see image](https://cdn.mrddd.xyz/img/2025/brave_n2o29KKbrV)

#### Categories
- Press the `Add Category` button and type any name you'd like, standard names include: `EU`, `US`, `NA`.
- For your first category, set the order to 1, then for any further categories go down the list, 2, 3, 4.
- The categories can be dragged around via the 6 dots on the left -> [see image](https://cdn.mrddd.xyz/img/2025/brave_ISjh8XCVeC)

#### Connecting Servers
- Press the `Add Server` button, the Server ID is the Battlemetrics ID of the server, you can find your server by searching for it -> [here](https://www.battlemetrics.com/servers/rust)
- When you find your server, the ID is listed in the URL -> [see image](https://cdn.mrddd.xyz/img/2025/brave_bho4Qk2SAw) | in this example the ID is **just** `6803740`.
- You can name the server whatever you'd like, we'd reccomend naming it simplistic without your server / brand name included, for example: `[EU] 10x | Kits | Shop | PVP+`.
- The Server Address is an optional override for the IP address provided to players viewing your website, by default it's taken from battelmetrics, but if you'd like to override it to your domain, for example: `eu10x.yourDomain.com`
- If you are using the override for the address, make sure you set up your domain correctly -> [see guide from Facepunch](https://wiki.facepunch.com/rust/dns-records)
- Choose a category, which you previously made.
- The Header Image Path is another optional override for the banner used on the public servers page. You will need to host the image, you can do this with your own CDN Manager in **Step 4**.
- The order format follows the same as Categories.
- Example server setup -> [see image](https://cdn.mrddd.xyz/img/2025/brave_qTyAjtoY0u)

## 2. Creating Map Votes
- This will **not** work if you have not connected Rust Maps API or Cloudflare R2 in the setup proccess, if you have at least **one** of them connected - it **will** work.
- Navigate to the Map Voting tab on the nav on the left.
- Press `Create New Vote`, select a server and the dates you'd like to use.
- You can use a custom map url or a normal map url from Rust Maps. Examples: https://rustmaps.com/map/3700_330409162 | https://rustmaps.com/map/fb04086f440044768271096bff5c8e5e
- Press `Create New Vote` again to start the vote, you can access this from the home page nav under "Maps".

## 3. Custom Pages
- Navigate to the Pages tab on the nav on the left.
- Press the `Create Page` button, and you will see an optional Server option, you can choose between: "None" - this will be a general page like "about us" | and a specific Server - this can be used for server specific information like features, or commands.
- The URL Slug is the last part at the end of your domain where you can access this page from, for example magicservices.co**/dashboard** - it's "dashboard" at the end.
- The Content is what you'd like shown on the page, make sure you follow the Markdown format, your choice of AI can help you with this -> [see image](https://cdn.mrddd.xyz/img/2025/brave_D0r4h3KM0D)
- Make sure the page is Enabled and press `Create Page` again.
- You will now see something like this -> [see image](https://cdn.mrddd.xyz/img/2025/brave_pmzSClavsf)
- If you want it on your [home page nav](https://cdn.mrddd.xyz/img/2025/brave_lq40yzLr9H) you can simply press the `Add to Nav` button.
- The Navigation panel is explained more in depth on **Step X.** if you'd like configure it more.

## 4. CDN Manager
- This will **not** work if you haven't connected Cloudflare R2 in the setup proccess.
- Navigate to the CDN tab on the nav on the left.
- You will see an option to Select Image(s) from your pc, and optionally add a description.
- Once you have uploaded an image, press on the [`Manage Images`](https://cdn.mrddd.xyz/img/2025/brave_MQbO9syO9z) tab.
- Here you can press `Copy` to get the URL for your server banner override, or delete stored images.
- You can rename the file by pressing the edit button -> [see image](https://cdn.mrddd.xyz/img/2025/brave_I8oVuFrxUO)

## 5. Ticket Settings
- Navigate to the Ticket Settings tab on the nav on the left, **under** the general Settings category -> [see image](https://cdn.mrddd.xyz/img/2025/brave_Lbsc11s0f6)

#### Understandings
- Categories are ticket options.
- Fields can only be placed within Steps.
- A field is a ticket question.

#### Creating a ticket option.
- Press `New Category` - it should look like this when opened -> [see image](https://cdn.mrddd.xyz/img/2025/brave_wn69pyHpwv)
- The Category Name is the Ticket Title, for example "Player Reports"
- The first step and a field is added for you already, you will see a `Label` option, this is the Field.
- That Label is where you type the Ticket Question, for example "Who are you reporting?".
- You can change the type of answer applicable via the button -> [see image](https://cdn.mrddd.xyz/img/2025/brave_oe76RB4Kq2)
- You can expand on answer restrictions by pressing the down arrow next to the delete button -> [see image](https://cdn.mrddd.xyz/img/2025/brave_dulnwoHFIR)
- It shows different options below depending on the type of answer option you chose -> [see image](https://cdn.mrddd.xyz/img/2025/brave_h43Qnpmz53)
- Press `Save Category` and now your ticket option will show on your main site in the "Support" page.

## 6. Leaderboard Settings
- Navigate to the Leaderboard Settings tab on the nav on the left.
**- This should mostly be left alone, unless you know what you're doing.**

#### Adding Custom Icons
- You can add custom images onto items within the Columns tab -> [see image](https://cdn.mrddd.xyz/img/2025/brave_aXrAunbF7U)
- Press on `PVP` and you can change with Category you're modifying.
- Press the edit button on a specific item within the category -> [see image](https://cdn.mrddd.xyz/img/2025/brave_5ljk0z487C)
- Leave the Column Key alone, unless you know what you're doing.
- You will see `Icon (optional)` here, this is where you can paste an image URL (which you can host on your CDN).
- Make sure you press `Update Column`.

#### Leaderboard Theme
- You can modify the theme within the Settings tab -> [see image](https://cdn.mrddd.xyz/img/2025/brave_rriaW8rJKR)
- Here you can also Reset the Leaderboard, this is **not** reversable.

## 7. SEO Settings
- Navigate to the SEO tab on the nav on the left.

#### Global SEO
- This is similar to a "fall over" SEO on your individual pages, however it should not be ignored.
- Each option will have an information icon to help you understand what to input in each box -> [see image](https://cdn.mrddd.xyz/img/2025/brave_ocKrcBq0qy)

#### Pages SEO
- There will be less options here, but they are more important.
- You should not change the slug on the pre filled pages here, everything else is your choice.
- Everything here is also explained via the information icon -> [see image](https://cdn.mrddd.xyz/img/2025/brave_HkBhzXwDcF)

## 8. Theme Settings
#### General Theme Settings
- Navigate to the Theme Settings tab on the nav on the left.
- Enable Advanced mode, by checking this on -> [see image](https://cdn.mrddd.xyz/img/2025/brave_l5PcDEUx75)
- You can click on information on the page and edit them on the right hand side -> [see image](https://cdn.mrddd.xyz/img/2025/brave_5tE4rebyNF)
- You can change the theme colors by scrolling down on the right.
- You can change individual page themes by pressing the `Page Theme` button on the top -> [see image](https://cdn.mrddd.xyz/img/2025/brave_9Y3Wevjljw)
- **This is where you can edit the rules.**

#### Changing the Logo and Background image
- When you first open the theme editor, scroll down on the right hand side until you see Background and Branding -> [see image](https://cdn.mrddd.xyz/img/2025/brave_Nd8ore0zdF)
- Here you can paste image URLs for each option, these images can be hosted at your prefered location, or on your own CDN Manager - see **Step 4.**
- You will need to convert your logo to a favicon via [Favicon.io](https://favicon.io/favicon-converter/), upload your logo to this site, download the .zip and extract it, then upload the `favicon.ico` file to your CDN Manager.

## 9. Legal Information 
- Navigate to the Legal Information tab on the nav on the left.
- This is where you can edit the Terms of Service and Privacy Policy of your site, make sure you follow the same markdown format as the custom pages in the previous instructions.

## 10. Admin Logs
- Navigate to the Admin Logs tab on the nav on the left.
- These are plain and simple admin logs, it tracks changes on site and stores them here -> [see image](https://cdn.mrddd.xyz/img/2025/brave_refY2e0LfY)

## 11. API Keys
- Navigate to the API Keys tab on the nav on the left.
- Here you can press `Create New API Key` and choose specific permissions, this is used for the bot and plugin. You should have seperate API Keys for the bot, and **each** server.

## WIP from here.







