const puppeteer = require('puppeteer');

async function run() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    try {
        console.log('Navigating to login...');
        await page.goto('http://localhost:5173/login');
        
        console.log('Logging in as wholesaler...');
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', 'wholesaler_1@demo.com');
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        console.log('Waiting for wholesaler dashboard...');
        await page.waitForSelector('.glass'); // Wait for dashboard to load
        
        // Wait a bit for stock to load
        await new Promise(r => setTimeout(r, 2000));

        console.log('Looking for purchase button...');
        const buttons = await page.$$('button');
        let purchaseButton = null;
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && text.includes('Purchase')) {
                purchaseButton = btn;
                break;
            }
        }

        if (!purchaseButton) {
            console.log('No purchase button found! Maybe no stock?');
            return;
        }

        console.log('Clicking purchase button...');
        await purchaseButton.click();

        console.log('Waiting for modal...');
        await page.waitForSelector('input[placeholder="Amount to buy..."]');
        
        console.log('Filling purchase form...');
        await page.type('input[placeholder="Amount to buy..."]', '5');
        await page.type('input[placeholder="Set your selling price..."]', '55');

        console.log('Confirming purchase...');
        // Find Confirm Purchase button
        const confirmBtn = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirm Purchase'));
        });
        
        // Listen for dialog (alert)
        page.on('dialog', async dialog => {
            console.log('Received alert:', dialog.message());
            await dialog.accept();
        });

        await confirmBtn.click();
        
        console.log('Wait for success...');
        await new Promise(r => setTimeout(r, 2000));
        console.log('Done testing UI flow.');

    } catch (err) {
        console.error('Error during UI test:', err);
    } finally {
        await browser.close();
    }
}
run();
