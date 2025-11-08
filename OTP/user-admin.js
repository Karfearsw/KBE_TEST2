// User Management Utility for Flipstackk
import readline from 'readline';
import fetch from 'node-fetch';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Base URL for API calls
const BASE_URL = 'http://localhost:5000';

// Store the cookie for authentication
let authCookie = '';

/**
 * Main function to run the utility
 */
async function main() {
  console.log('======================================');
  console.log('Flipstackk User Management Utility');
  console.log('======================================');
  
  try {
    // First log in to get authentication cookie
    await login();
    
    // Show main menu
    await showMainMenu();
  } catch (error) {
    console.error('Error:', error.message);
    rl.close();
  }
}

/**
 * Log in to the API
 */
async function login() {
  console.log('\nPlease log in with admin credentials:');
  
  const username = await askQuestion('Username: ');
  const password = await askQuestion('Password: ');
  
  try {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    
    const user = await response.json();
    
    if (user.role !== 'admin') {
      throw new Error('You must have admin privileges to use this utility');
    }
    
    // Store the cookie for future requests
    authCookie = response.headers.get('set-cookie');
    
    console.log(`\nLogged in as ${user.name} (${user.role})\n`);
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Show the main menu
 */
async function showMainMenu() {
  console.log('\nMAIN MENU:');
  console.log('1. List all users');
  console.log('2. Create demo user');
  console.log('3. Delete user by ID');
  console.log('4. Delete users by username');
  console.log('5. Exit');
  
  const choice = await askQuestion('Enter your choice: ');
  
  switch (choice) {
    case '1':
      await listUsers();
      break;
    case '2':
      await createDemoUser();
      break;
    case '3':
      await deleteUserById();
      break;
    case '4':
      await deleteUsersByUsername();
      break;
    case '5':
      console.log('Exiting...');
      rl.close();
      return;
    default:
      console.log('Invalid choice. Please try again.');
      await showMainMenu();
      break;
  }
}

/**
 * List all users
 */
async function listUsers() {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/team`, { method: 'GET' });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    
    const users = await response.json();
    
    console.log('\nUSER LIST:');
    console.log('-------------------------------------');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Name: ${user.name}, Role: ${user.role}`);
    });
    console.log('-------------------------------------');
    
    await showMainMenu();
  } catch (error) {
    console.error('Error:', error.message);
    await showMainMenu();
  }
}

/**
 * Create a demo user
 */
async function createDemoUser() {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/create-demo-user`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create demo user: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('\nDemo user created successfully:');
    console.log(`Username: ${result.user.username}`);
    console.log(`Password: demo123`);
    console.log(`Role: ${result.user.role}`);
    
    await showMainMenu();
  } catch (error) {
    console.error('Error:', error.message);
    await showMainMenu();
  }
}

/**
 * Delete a user by ID
 */
async function deleteUserById() {
  try {
    const userId = await askQuestion('Enter user ID to delete: ');
    
    if (!userId || isNaN(parseInt(userId))) {
      throw new Error('Invalid user ID');
    }
    
    const response = await authenticatedFetch(`${BASE_URL}/api/users/${userId}`, { 
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to delete user: ${error.message || response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`\n${result.message}`);
    
    await showMainMenu();
  } catch (error) {
    console.error('Error:', error.message);
    await showMainMenu();
  }
}

/**
 * Delete users by username
 */
async function deleteUsersByUsername() {
  try {
    // First fetch all users
    const response = await authenticatedFetch(`${BASE_URL}/api/team`, { method: 'GET' });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    
    const users = await response.json();
    
    // Ask for usernames to delete (comma-separated)
    const targetUsernames = await askQuestion('Enter usernames to delete (comma-separated): ');
    const targets = targetUsernames.split(',').map(u => u.trim().toLowerCase());
    
    if (targets.length === 0) {
      throw new Error('No valid usernames provided');
    }
    
    // Find matching users
    const usersToDelete = users.filter(user => 
      targets.includes(user.username.toLowerCase())
    );
    
    if (usersToDelete.length === 0) {
      console.log('\nNo matching users found.');
      await showMainMenu();
      return;
    }
    
    // Confirm deletion
    console.log('\nUsers to delete:');
    usersToDelete.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Name: ${user.name}, Role: ${user.role}`);
    });
    
    const confirm = await askQuestion('\nAre you sure you want to delete these users? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Deletion cancelled.');
      await showMainMenu();
      return;
    }
    
    // Delete each user
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of usersToDelete) {
      try {
        const deleteResponse = await authenticatedFetch(`${BASE_URL}/api/users/${user.id}`, { 
          method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
          console.log(`Deleted user: ${user.username}`);
          successCount++;
        } else {
          const error = await deleteResponse.json();
          console.error(`Failed to delete ${user.username}: ${error.message || deleteResponse.statusText}`);
          errorCount++;
        }
      } catch (err) {
        console.error(`Error deleting ${user.username}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\nDeletion complete. Success: ${successCount}, Failed: ${errorCount}`);
    
    await showMainMenu();
  } catch (error) {
    console.error('Error:', error.message);
    await showMainMenu();
  }
}

/**
 * Make an authenticated fetch request
 */
async function authenticatedFetch(url, options = {}) {
  if (!authCookie) {
    throw new Error('Not authenticated');
  }
  
  const headers = options.headers || {};
  headers['Cookie'] = authCookie;
  
  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Ask a question and return the answer
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Start the utility
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});