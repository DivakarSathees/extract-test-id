const puppeteer = require('puppeteer');
const xlsx = require("xlsx");
const fs = require("fs");
require("dotenv").config();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

exports.extractTestID = async (filepath, url, email, password, course, module, testname) => {
    try {
        console.log("Launching automation...");

        const filePath = filepath; // Path to the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const UEmails = sheetData.map(row => ({
            UEmail: row["User Email"]
        }));

        fs.unlinkSync(filePath); // remove file after reading
        console.log("Extracted User Emails:", UEmails);

        if (!fs.existsSync('/usr/bin/chromium')) {
        console.error('Chromium not found at /usr/bin/chromium');
        } else {
        console.log('Chromium found at /usr/bin/chromium');
        }


        const { testIds, token } = await loginAndGetLocalStorage(
            url, email, password, course, module, testname, UEmails
        );

        return { testIds, token };
    } catch (error) {
        console.error('Error in puplocalstorage:', error);
        throw error;
    }
};

async function loginAndGetLocalStorage(url, USEREMAIL, PASSWORD, COURSE, MODULE, TESTNAME, UEmails) {

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--remote-debugging-port=9222',
            '--start-maximized',
            '--ignore-certificate-errors'
        ],
        executablePath:
          process.env.NODE_ENV === "production"
            ? process.env.PUPPETEER_EXECUTABLE_PATH
            : puppeteer.executablePath(),
        protocolTimeout: 120000,

      });

    const page = await browser.newPage();
    await page.setViewport({
        width: 1920, // Full width for most screens
        height: 1080, // Full height
        });
    try {
        await page.goto(url, { waitUntil: "networkidle2" });
        await page.type("#emailAddress", USEREMAIL);
        await page.type("#password", PASSWORD);
        console.log("Logging in...1");        
        await page.click(".form__button.ladda-button");
        console.log("Logging in...2");        

        // await page.waitForNavigation(
        //     // { waitUntil: "networkidle2" }
        // );
        console.log("Logging in...3");        

        await delay(15000);
        console.log("Logging in...4");        


        await page.waitForSelector("li[ptooltip='Courses']", { timeout: 30000 });
        await page.click("li[ptooltip='Courses']");
        console.log("Logging in...5");        

        await delay(15000);
        console.log("Logging in...6");
        // const screenshotBuffer = await page.screenshot({ fullPage: true });
        // console.log("Base64 Screenshot:\n", screenshotBuffer.toString('base64'));
        

        await page.waitForSelector("input[placeholder='Enter course name to search']", { timeout: 30000 });


        console.log("Logging in...7");
        // await page.screenshot({ path: 'screenshot_course_search.png', fullPage: true });

        
        await page.type("input[placeholder='Enter course name to search']", COURSE);

        
        await delay(10000);
        console.log("Logging in...8");

        await page.click("button.search-icon");

        await delay(4000);
        console.log("Searching for course...");
        
        // javascript-obfuscator:disable

        const courseClicked = await page.evaluate((text) => {
            
            const xpath = `//*[contains(text(), "${text}")]`;

            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const node = result.singleNodeValue;
            if (node) {
                node.click();
                return true;
            }
            return false;

        }, COURSE);
        
        if (!courseClicked) console.log("❌ Course not found or click failed.");
        else console.log("✅ Course clicked.");


        await delay(15000);

        const moduleClicked = await page.evaluate((moduleIndex) => {
            const xpath = `//*[@id="ui-tabpanel-3"]/div/div/div[1]/div[3]/div[${moduleIndex}]`;
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const node = result.singleNodeValue;
            if (node) {
                node.click();
                return true;
            }
            return false;
        }, MODULE);

        if (!moduleClicked) console.log("❌ Module not found or click failed.");
        else console.log("✅ Module clicked.");
        await delay(4000);
        try{
            
        const testClicked = await page.evaluate((testName) => {
            // const xpath = `//div[contains(@class, 'moduletest')][.//span[contains(@class, 'testname') and normalize-space(text()) = '${testName}']]//button[normalize-space(text())='View Results']`;
            const xpath = `//div[contains(@class, 'moduletest')][.//div[contains(@class, 'ui-g-5') and contains(normalize-space(.), "${testName}")]]//button[normalize-space(text())='View Results']`;
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const node = result.singleNodeValue;
            if (node) {
                node.click();
                return true;
            }
            return false;
        }, TESTNAME);
        if (!testClicked) console.log("❌ Test Result button not found.");
        else console.log("✅ Test Result clicked.");
    } catch (error) {

        const testClicked = await page.evaluate((testName) => {
            const xpath1 = `//div[contains(@class, 'moduletest')][.//span[contains(@class, 'testname') and normalize-space(text()) = '${testName}']]//button[normalize-space(text())='View Results']`;
            const result1 = document.evaluate(xpath1, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const node1 = result1.singleNodeValue;
            if (node1) {
                node1.click();
                return true;
            }
            return false;
        }, TESTNAME);
        if (!testClicked) console.log("❌ Test Result button not found.");
        else console.log("✅ Test Result clicked.");
    }

        

        await delay(4000);

        const testIds = [];

        for (const { UEmail } of UEmails) {
            console.log("Processing email:", UEmail);

            await page.waitForSelector('input[placeholder="Enter your search term"]');
            await page.click('input[placeholder="Enter your search term"]', { clickCount: 3 });
            await page.keyboard.press('Backspace');
              console.log("Backspace pressed");
            await delay(1000);
              
              

            await page.type('input[placeholder="Enter your search term"]', UEmail, { delay: 100 });

            console.log("Email entered:", UEmail);
            await delay(1000);

            await page.click('button.ui-inputgroup-addon-ec');
            await delay(3000);

            await page.waitForSelector('#testresulttable tr:nth-child(2) td:nth-child(4) span:nth-child(2) i');

            
            await page.click('#testresulttable tr:nth-child(2) td:nth-child(4) span:nth-child(2) i');

            await delay(3000);
            const pages = await browser.pages();
            const newTab = pages[pages.length - 1];

            if (newTab !== page) {
                await newTab.bringToFront();
                const testIdUrl = newTab.url();
                testIds.push({ testId: testIdUrl, email: UEmail });
                await newTab.close();
                await page.bringToFront();
            }
        }

        const localStorageData = await page.evaluate(() => {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                data[key] = localStorage.getItem(key);
            }
            return data;
        });

        const tokenMatch = localStorageData.token?.match(/"token":"(.*?)"/);
        const token = tokenMatch ? tokenMatch[1] : null;

        if (token) {
            // console.log("✅ Extracted Token:", token);
        } else {
            console.log("❌ Token not found.");
        }

        // return token;        
        return { testIds, token };

    } catch (error) {
        console.error('Error during Puppeteer workflow:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// // Call the function with your login and test details
// puplocalstorage(
//     "divakar.s@iamneo.ai",
//     "divakar.s@308",
//     "LTIM Orchard Dotnet Dec 24 Batch 01 Assessment Course",
//     "3",
//     "LTIM Orchard Dotnet Dec 24 Milestone 01 Attempt 02 COD 02"
// )
//     .then(data => {
//         console.log("Final Extracted Token:", data);
//     })
//     .catch(error => {
//         console.error('Script failed:', error);
//     });
