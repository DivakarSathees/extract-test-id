const express = require('express');
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const cors = require("cors");
const app = express();
const os = require('os');
const { extractTestID } = require('./extractTestID');

const port = 3000;
const upload = multer({ dest: "uploads/" });

app.use(cors({ origin: ['https://forntend-weightagesplit-1.onrender.com','http://localhost:4200'] }));

app.use(express.json());

let driver; // Global browser session
// const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selenium-user-data-'));

// const options = new chrome.Options();
// options.addArguments('--headless');
// options.addArguments('--no-sandbox');
// options.addArguments('--disable-dev-shm-usage');
// options.addArguments('--disable-gpu');
// options.addArguments('--window-size=1920,1080');

// POST endpoint to perform login
app.post('/visit', upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: "No file uploaded." });
  }
  let { LOGIN_URL, USEREMAIL, PASSWORD, COURSE, MODULE, TESTNAME } = req.body;

  if (!LOGIN_URL || !USEREMAIL || !PASSWORD) {
    return res.status(400).send({ error: 'LOGIN_URL, USEREMAIL, and PASSWORD are required.' });
  }

  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  // Process each row in the sheet
  const UEmails = sheetData.map((row) => {
    return {
      UEmail: row["User Email"],
    };
  });
  let testIds = [];
  let token = null; // Initialize token variable

  // fs.unlinkSync(filePath);
  try {

    const { testIds: ids, token: extractedToken } = await extractTestID(
      filePath,
      LOGIN_URL,
      USEREMAIL,
      PASSWORD,
      COURSE,
      MODULE,
      TESTNAME
    );

    testIds = ids;
    token = token || extractedToken;
    res.send({ testIds, token }); // Send the test IDs as a response
    
    } catch (error) {
    console.error("Error making POST request to /visit API:", error.message);
    res.status(500).send({ error: "Failed to fetch test IDs from the API." });
    return;
    } 
    // finally {
    // fs.unlinkSync(filePath);
    // }
});

app.get('/screenshot', (req, res) => {
  res.sendFile(__dirname + '/screenshot_course_search.png');
});


// Optional endpoint to close browser
app.get('/close', async (req, res) => {
  if (driver) {
    await driver.quit();
    driver = null;
    res.send({ message: "Browser closed." });
  } else {
    res.send({ message: "No browser session is active." });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
