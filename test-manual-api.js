// Test script for Manual Attendance API endpoints
// Run with: node test-manual-api.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testManualAPI() {
  console.log('🧪 Testing Manual Attendance API Endpoints\n');

  try {
    // Test 1: Manual Check-In
    console.log('1️⃣ Testing Manual Check-In...');
    const checkInResponse = await axios.post(`${BASE_URL}/api/attendance/manual-check-in`, {
      workerId: 1,
      siteId: 1,
      checkInTime: new Date().toISOString()
    });
    
    if (checkInResponse.data.success) {
      console.log('✅ Manual Check-In successful');
      console.log('   Worker:', checkInResponse.data.data.worker.firstName, checkInResponse.data.data.worker.lastName);
      console.log('   Site:', checkInResponse.data.data.site.siteName);
      console.log('   Check-in Time:', checkInResponse.data.data.checkInTime);
    }

    // Test 2: Manual Check-Out
    console.log('\n2️⃣ Testing Manual Check-Out...');
    const checkOutResponse = await axios.post(`${BASE_URL}/api/attendance/manual-check-out`, {
      workerId: 1,
      siteId: 1,
      checkOutTime: new Date().toISOString(),
      checkOutMethod: 'MANUAL',
      fingerprintVerified: false
    });
    
    if (checkOutResponse.data.success) {
      console.log('✅ Manual Check-Out successful');
      console.log('   Total Hours:', checkOutResponse.data.summary.totalHours);
      console.log('   Regular Hours:', checkOutResponse.data.summary.regularHours);
      console.log('   Overtime Hours:', checkOutResponse.data.summary.overtimeHours);
      console.log('   Status:', checkOutResponse.data.summary.status);
    }

    // Test 3: Get Manual Records
    console.log('\n3️⃣ Testing Get Manual Records...');
    const manualRecordsResponse = await axios.get(`${BASE_URL}/api/attendance/manual`, {
      params: {
        page: 1,
        limit: 10,
        type: 'all'
      }
    });
    
    if (manualRecordsResponse.data.success) {
      console.log('✅ Manual Records retrieved successfully');
      console.log('   Total Records:', manualRecordsResponse.data.pagination.total);
      console.log('   Records Found:', manualRecordsResponse.data.data.length);
      console.log('   Status Breakdown:', manualRecordsResponse.data.summary.statusBreakdown);
    }

    // Test 4: Get All Attendance Records
    console.log('\n4️⃣ Testing Get All Attendance Records...');
    const allRecordsResponse = await axios.get(`${BASE_URL}/api/attendance`, {
      params: {
        page: 1,
        limit: 10
      }
    });
    
    if (allRecordsResponse.data.success) {
      console.log('✅ All Attendance Records retrieved successfully');
      console.log('   Total Records:', allRecordsResponse.data.pagination.total);
      console.log('   Records Found:', allRecordsResponse.data.data.length);
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
testManualAPI();
