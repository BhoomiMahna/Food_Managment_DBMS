async function testApi() {
    try {
        const loginRes = await fetch('http://localhost:5000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'retailer_1@demo.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        const rToken = loginData.token;
        console.log('Retailer logged in');

        const marketRes = await fetch('http://localhost:5000/retailer/wholesalers', {
            headers: { 'Authorization': `Bearer ${rToken}` }
        });
        const marketData = await marketRes.json();
        const firstItem = marketData[0];
        console.log('Found retail market item:', firstItem.id);

        const buyRes = await fetch('http://localhost:5000/retailer/buy', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${rToken}` 
            },
            body: JSON.stringify({
                wholesaler_stock_id: firstItem.id,
                quantity: 1,
                selling_price: 60
            })
        });
        const buyData = await buyRes.json();
        console.log('Retailer HTTP Buy Response:', buyRes.status, buyData);

    } catch (err) {
        console.error('HTTP Error:', err);
    }
}
testApi();
