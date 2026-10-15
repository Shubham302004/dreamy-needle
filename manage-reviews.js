#!/usr/bin/env node
/**
 * Dreamy Needle — Review Manager CLI (Pure File-Based, No Database Required)
 * Manage studio reviews stored in reviews.json
 *
 * Commands:
 *   node manage-reviews.js list
 *   node manage-reviews.js add "Client Name" "City" "Item" 5 "Review text..."
 *   node manage-reviews.js delete <review_id>
 *   node manage-reviews.js clear
 *
 * To publish updates to your live site, simply run:
 *   git commit -am "Update reviews" && git push
 */

const fs = require('fs');
const path = require('path');

const REVIEWS_FILE = path.join(__dirname, 'reviews.json');

function loadReviews() {
  if (!fs.existsSync(REVIEWS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8') || '[]');
  } catch (e) {
    return [];
  }
}

function saveReviews(reviews) {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
}

function printReviewsTable(reviews) {
  console.log(`\n📋 Dreamy Needle — Studio Reviews (${reviews.length} total):`);
  console.log('─'.repeat(70));
  if (reviews.length === 0) {
    console.log('No reviews currently stored.');
  } else {
    reviews.forEach((r, idx) => {
      console.log(`[#${idx + 1}] ID: ${r.id} | Rating: ${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}`);
      console.log(`     Client: ${r.name || 'Verified Client'} (${r.city || 'India'}) • Item: ${r.item || 'Custom Embroidery'}`);
      console.log(`     Date:   ${r.date || 'Verified Client'}`);
      console.log(`     Text:   "${r.text}"`);
      console.log('─'.repeat(70));
    });
  }
}

const args = process.argv.slice(2);
const command = args[0] || 'list';

if (command === 'list') {
  const reviews = loadReviews();
  printReviewsTable(reviews);
  console.log('\nCommands:');
  console.log('  node manage-reviews.js add <name> <city> <item> <rating 1-5> <text>');
  console.log('  node manage-reviews.js delete <id>');
  console.log('  node manage-reviews.js clear');
  console.log('\nAfter making changes, push to GitHub to update your live site:');
  console.log('  git commit -am "Update reviews" && git push');
} else if (command === 'add') {
  const name = args[1];
  const city = args[2] || 'India';
  const item = args[3] || 'Custom Embroidery';
  const rating = Math.min(5, Math.max(1, parseInt(args[4], 10) || 5));
  const text = args[5];

  if (!name || !text) {
    console.error('❌ Error: Name and Review Text are required.');
    console.error('Usage: node manage-reviews.js add "Client Name" "City" "Item" <rating> "Review text"');
    console.error('Example: node manage-reviews.js add "Ananya Sen" "Kolkata" "Personalized Kurti" 5 "Beautiful neat stitches!"');
    process.exit(1);
  }

  const reviews = loadReviews();
  const newReview = {
    id: Date.now(),
    name: name,
    city: city,
    item: item,
    rating: rating,
    date: 'Verified Client',
    text: text,
    isUserGenerated: true
  };
  reviews.unshift(newReview);
  saveReviews(reviews);

  console.log(`✅ Added review from "${name}" (ID: ${newReview.id}) to reviews.json!`);
  console.log('\nRun this to deploy it live:');
  console.log('  git commit -am "Add review" && git push');
} else if (command === 'delete') {
  const targetId = args[1];
  if (!targetId) {
    console.error('❌ Error: Please specify the review ID to delete.');
    console.error('Usage: node manage-reviews.js delete <id>');
    process.exit(1);
  }
  const reviews = loadReviews();
  const filtered = reviews.filter(r => String(r.id) !== String(targetId));
  if (filtered.length === reviews.length) {
    console.log(`⚠️ No review found with ID: ${targetId}`);
  } else {
    saveReviews(filtered);
    console.log(`✅ Successfully removed review with ID: ${targetId}`);
    console.log(`   Remaining reviews: ${filtered.length}`);
    console.log('\nRun this to deploy the removal live:');
    console.log('  git commit -am "Remove review" && git push');
  }
} else if (command === 'clear') {
  saveReviews([]);
  console.log('✅ Cleared all reviews from reviews.json.');
  console.log('\nRun this to deploy the change live:');
  console.log('  git commit -am "Clear reviews" && git push');
} else {
  console.log(`Unknown command: ${command}`);
  console.log('Available commands: list, add, delete, clear');
}
