// common.js
// ==================== FIREBASE CONFIGURATION ====================
const firebaseConfig = {
    apiKey: "AIzaSyCE5iYGOl-ABjXs5gaS6Kl0zeGqHZf0vdg",
    authDomain: "sierra-leone-school-attendance.firebaseapp.com",
    projectId: "sierra-leone-school-attendance",
    storageBucket: "sierra-leone-school-attendance.firebasestorage.app",
    messagingSenderId: "185301289478",
    appId: "1:185301289478:web:f3eb92954cb8570da81187"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence().catch(err => console.warn(err));

// Helper functions
function showMessage(msg, type, elemId) {
    let div = document.getElementById(elemId);
    if (div) {
        div.innerHTML = `<div class="${type}">${msg}</div>`;
        setTimeout(() => div.innerHTML = '', 4000);
    } else alert(msg);
}
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}
function closeModal(id) { let el = document.getElementById(id); if (el) el.style.display = 'none'; }
function openModal(id) { let el = document.getElementById(id); if (el) el.style.display = 'flex'; }
function getValidWhatsAppUrl(p, msg) {
    let raw = p.toString().replace(/\D/g, '');
    if (raw.startsWith('0')) raw = raw.substring(1);
    if (!raw.startsWith('232')) raw = '232' + raw;
    return (raw.length >= 10 && raw.length <= 15) ? 'https://wa.me/' + raw + '?text=' + encodeURIComponent(msg) : null;
}

// Global variables (will be shared)
let allStudents = {};
let studentDocMap = new Map();
let currentStudentDoc = null;
let currentTerm = 'term1';
let currentExamLevel = 'npse';
let currentAssessment = 'test1';
let currentFeeTerm = 'term1';
let currentUserRole = null;
let currentTeacherClass = null;
let currentParentStudentId = null;
let currentTeacherRegister = null;

// Authentication
async function checkUserRole(user) {
    if (!user) return null;
    let doc = await db.collection('users').doc(user.uid).get();
    return doc.exists ? doc.data() : null;
}
function updateUIForRole(r) {
    if (!r) { document.getElementById('mainApp').style.display = 'none'; return; }
    currentUserRole = r.role;
    currentTeacherClass = (r.role === 'teacher') ? r.class : null;
    currentParentStudentId = (r.role === 'parent') ? r.studentId : null;
    document.getElementById('mainApp').style.display = 'block';
    // Role-specific UI adjustments (to be added per module)
}
document.getElementById('loginBtn').onclick = async () => {
    let email = document.getElementById('loginEmail').value.trim();
    let pwd = document.getElementById('loginPassword').value;
    try {
        let cred = await auth.signInWithEmailAndPassword(email, pwd);
        let role = await checkUserRole(cred.user);
        if (!role) throw new Error("No role assigned");
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('userInfo').innerText = role.role.toUpperCase() + ': ' + cred.user.email;
        document.getElementById('logoutBtn').style.display = 'inline-block';
        updateUIForRole(role);
        // Module‑specific initialization will be called separately
    } catch (e) {
        let msgDiv = document.getElementById('loginMessage');
        if (msgDiv) msgDiv.innerHTML = '<div class="error">' + e.message + '</div>';
    }
};
document.getElementById('logoutBtn').onclick = async () => {
    await auth.signOut();
    location.reload();
};
async function updateOnlineStatus() {
    let badge = document.getElementById('onlineStatus');
    let syncBar = document.getElementById('syncBar');
    if (navigator.onLine) {
        if (badge) { badge.innerHTML = '🟢 Online'; badge.className = 'online-badge online'; }
        if (syncBar) { syncBar.innerHTML = '✅ Connected to cloud'; syncBar.style.background = '#4CAF50'; }
    } else {
        if (badge) { badge.innerHTML = '🔴 Offline'; badge.className = 'online-badge offline'; }
        if (syncBar) { syncBar.innerHTML = '⚠️ Offline mode - data will sync later'; syncBar.style.background = '#FF9800'; }
    }
}