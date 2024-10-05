function calculateTotal() {
    const principal = parseFloat(document.getElementById('principal').value) || 0;
    const interestPercent = parseFloat(document.getElementById('interest').value) || 0;

    if (principal < 0 || interestPercent < 0) {
        alert("เงินต้นและดอกเบี้ยต้องไม่เป็นค่าลบ");
        return;
    }

    const interest = (principal * (interestPercent / 100)).toFixed(2);
    document.getElementById('intperm').value = interest;
}

function addNewRowToPawnHistoryTable(gold) {
    const table = document.getElementById('pawnHistoryTable');
    const newRow = table.insertRow();
    newRow.innerHTML = `
        <td><a href="/pawn/gold-payment-history/${gold.goldId}">${gold.goldId}</a></td>
        <td>${gold.typeName.typeName}</td>
        <td>${gold.weight} กรัม</td>
        <td>${gold.principal} บาท</td>
        <td>${gold.intperm} บาท</td>
        <td>${gold.status}</td>
    `;
}

function updateGoldId() {
    let currentGoldId = parseInt(document.getElementById('goldId').value.match(/\d+/)[0]);
    currentGoldId++;
    const formattedGoldId = currentGoldId.toString().padStart(4, '0');
    document.getElementById('goldId').value = `G-${formattedGoldId}`;
}

async function submitPawnForm(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const customerId = formData.get('customerId');
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`/pawn/addpawn/${customerId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        alert(result.message);
        addNewRowToPawnHistoryTable(result.gold);

        // Reset form
        const fieldsToKeep = ['customerId', 'customerFName', 'customerLName', 'pawnId'];
        const savedValues = {};
        fieldsToKeep.forEach(field => savedValues[field] = form[field].value);
        form.reset();
        fieldsToKeep.forEach(field => form[field].value = savedValues[field]);

        updateGoldId();
    } catch (error) {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
}