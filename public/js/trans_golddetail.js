        // เก็บระยะเวลาระหว่าง nextDueDate และ startDate แรก
        let goldId; // Add this line to store goldId at a higher scope

        document.addEventListener('DOMContentLoaded', function() {
            const extendPaymentModal = document.getElementById('extendPaymentModal');
            const extendPaymentForm = document.getElementById('extendPaymentForm');
            const confirmExtendButton = document.getElementById('confirmExtend');
            let initialDuration;

            // เมื่อ modal เปิด
            extendPaymentModal.addEventListener('show.bs.modal', function(event) {
                const button = event.relatedTarget;
                goldId = button.getAttribute('data-payment-id');
                console.log('goldId:', goldId);
                
                if (!goldId) {
                    console.error('goldId is null or undefined');
                    return;
                }
                
                fetch(`/payment/gold/${goldId}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log('API response:', data);
                        const today = new Date();
                        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1); // วันที่กดต่อดอก + 1 วัน
                        
                        // คำนวณ initialDuration
                        if (data.nextDueDate && data.startDate) {
                            const nextDueDate = new Date(data.nextDueDate);
                            const originalStartDate = new Date(data.startDate);
                            initialDuration = nextDueDate.getTime() - originalStartDate.getTime();
                        } else {
                            console.warn('Unable to calculate initialDuration, using default value');
                            initialDuration = 30 * 24 * 60 * 60 * 1000; // 30 วัน
                        }
                        
                        console.log('Calculated initialDuration:', initialDuration);
                        
                        if (isNaN(initialDuration) || initialDuration <= 0) {
                            console.warn('Invalid initialDuration, using default value');
                            initialDuration = 30 * 24 * 60 * 60 * 1000; // 30 วัน
                        }
                        
                        const endDate = new Date(startDate.getTime() + initialDuration);
                        const nextDueDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000); // endDate + 1 วัน

                        const startDateInput = document.getElementById('startDate');
                        const endDateInput = document.getElementById('endDate');
                        const amountInput = document.getElementById('amount');
                        const nextDueDateInput = document.getElementById('nextDueDate');

                        if (startDateInput) startDateInput.value = startDate.toISOString().split('T')[0];
                        if (endDateInput) endDateInput.value = endDate.toISOString().split('T')[0];
                        if (amountInput) amountInput.value = data.intperm || '';
                        if (nextDueDateInput) nextDueDateInput.value = nextDueDate.toISOString().split('T')[0];

                        console.log('Form values set:', {
                            startDate: startDateInput ? startDateInput.value : 'N/A',
                            endDate: endDateInput ? endDateInput.value : 'N/A',
                            amount: amountInput ? amountInput.value : 'N/A',
                            nextDueDate: nextDueDateInput ? nextDueDateInput.value : 'N/A'
                        });
                    })
                    .catch(error => console.error('Error:', error));
            });

            // เมื่อกดปุ่มยืนยัน
            confirmExtendButton.addEventListener('click', function() {
                const formData = new FormData(extendPaymentForm);
                const formDataObject = {};
                formData.forEach((value, key) => { formDataObject[key] = value; });

                // ตรวจสอบและแปลงข้อมูลให้ถูกต้อง
                formDataObject.startDate = new Date(formDataObject.startDate).toISOString();
                formDataObject.endDate = new Date(formDataObject.endDate).toISOString();
                formDataObject.nextDueDate = new Date(formDataObject.nextDueDate).toISOString();
                formDataObject.amount = parseFloat(formDataObject.amount);

                console.log('Processed form data:', formDataObject);

                const requiredFields = ['startDate', 'endDate', 'nextDueDate', 'amount'];
                const missingFields = requiredFields.filter(field => !formDataObject[field]);
                
                if (missingFields.length > 0) {
                    alert(`กรุณากรอกข้อมูลให้ครบทุกช่อง: ${missingFields.join(', ')}`);
                    return;
                }
                // เพิ่มการตรวจสอบว่าทุกฟิลด์มีค่า
                if (!formDataObject.startDate || !formDataObject.endDate || !formDataObject.nextDueDate || !formDataObject.amount) {
                    alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
                    return;
                }

                // ตรวจสอบว่าข้อมูลถูกต้องก่อนส่ง
                if (isNaN(new Date(formDataObject.startDate).getTime()) ||
                    isNaN(new Date(formDataObject.endDate).getTime()) ||
                    isNaN(new Date(formDataObject.nextDueDate).getTime()) ||
                    isNaN(formDataObject.amount)) {
                    alert('กรุณากรอกข้อมูลให้ถูกต้องและครบถ้วน');
                    return;
                }

                console.log('Sending data:', formDataObject);

                fetch(`/payment/extend-payment/${goldId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formDataObject)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('ต่อดอกเรียบร้อยแล้ว');
                        location.reload();
                    } else {
                        alert('เกิดข้อผิดพลาด: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('เกิดข้อผิดพลาดในการต่อดอก');
                });
            });
        });

        document.addEventListener('DOMContentLoaded', function() {
            const redeemModal = document.getElementById('redeemModal');
            const redeemForm = document.getElementById('redeemForm');
            const confirmRedeemButton = redeemModal.querySelector('.btn-success');

            function calculateTotal() {
                const startDate = new Date(document.getElementById('redeemStartDate').value);
                const endDate = new Date(document.getElementById('redeemEndDate').value);
                const principal = parseFloat(document.getElementById('initialAmount').value) || 0;
                const interest = parseFloat(document.getElementById('interestAmount').value) || 0;

                const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
                const totalAmount = principal + (principal * (interest / 100) / 30) * daysDiff;

                document.getElementById('totalAmount').value = totalAmount.toFixed(2);
            }

            redeemModal.addEventListener('show.bs.modal', function(event) {
                const button = event.relatedTarget;
                const goldId = button.getAttribute('data-gold-id');
                console.log('Modal opening for goldId:', goldId);

                if (!goldId) {
                    console.error('goldId is missing');
                    alert('เกิดข้อผิดพลาด: ไม่พบรหัสทอง');
                    return;
                }

                this.setAttribute('data-gold-id', goldId);

                fetch(`/payment/get-latest-data/${goldId}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log('API Data:', data);
                        if (data.success) {
                            document.getElementById('redeemStartDate').value = data.startDate;
                            
                            // ตั้งค่าวันที่สิ้นสุดเป็นวันที่ปัจจุบันในเวลาท้องถิ่นของ Thailand
                            const now = new Date();
                            const offset = now.getTimezoneOffset() * 60000;
                            const localISOTime = (new Date(now - offset)).toISOString().split('T')[0];
                            document.getElementById('redeemEndDate').value = localISOTime;
                            
                            document.getElementById('initialAmount').value = data.principal;
                            document.getElementById('interestAmount').value = data.interest; // เปลี่ยนจาก intperm เป็น interest
                            calculateTotal();
                        } else {
                            throw new Error(data.message || 'Failed to fetch gold data');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + error.message);
                    });
            });

            // เพิ่ม event listener สำหรับการเปลี่ยนแปลงวันที่หรือจำนวนเงิน
            document.getElementById('redeemEndDate').addEventListener('change', calculateTotal);
            document.getElementById('initialAmount').addEventListener('input', calculateTotal);
            document.getElementById('interestAmount').addEventListener('input', calculateTotal);

            // เมื่อกดปุ่มยืนยันการไถ่คืน
            confirmRedeemButton.addEventListener('click', function() {
                const goldId = redeemModal.getAttribute('data-gold-id');
                const formData = new FormData(redeemForm);
                const redeemData = {
                    goldId: goldId,
                    startDate: formData.get('redeemStartDate'),
                    endDate: formData.get('redeemEndDate'),
                    initialAmount: parseFloat(formData.get('initialAmount')),
                    interestAmount: parseFloat(formData.get('interestAmount')),
                    totalAmount: parseFloat(formData.get('totalAmount'))
                };

                fetch('/payment/redeem', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(redeemData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('ไถ่คืนเรียบร้อยแล้ว');
                        location.reload();
                    } else {
                        alert('เกิดข้อผิดพลาด: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('เกิดข้อผิดพลาดในการไถ่คืน');
                });
            });

            // เพิ่ม event listener สำหรับการเปลี่ยนแปลงวันที่
            document.getElementById('redeemEndDate').addEventListener('change', calculateTotal);
        });

        document.addEventListener('DOMContentLoaded', function() {
            const extendButton = document.getElementById('extendButton');
            const redeemButton = document.getElementById('redeemButton');
            const goldStatus = '<%= gold.status %>'; // รับค่าสถานะจาก server

            function updateButtonStatus() {
                if (goldStatus === 'ไถ่คืน') {
                    extendButton.disabled = true;
                    extendButton.title = 'ไม่สามารถต่อดอกได้เนื่องจากทองถูกไถ่คืนแล้ว';
                    redeemButton.disabled = true;
                    redeemButton.title = 'ทองถูกไถ่คืนแล้ว';
                }
            }

            updateButtonStatus();

            // Event listeners สำหรับปุ่มต่อดอกและไถ่คืน
            extendButton.addEventListener('click', function(event) {
                if (goldStatus === 'ไถ่คืน') {
                    event.preventDefault();
                    alert('ไม่สามารถต่อดอกได้เนื่องจากทองถูกไถ่คืนแล้ว');
                }
            });

            redeemButton.addEventListener('click', function(event) {
                if (goldStatus === 'ไถ่คืน') {
                    event.preventDefault();
                    alert('ทองถูกไถ่คืนแล้ว');
                }
            });
        });