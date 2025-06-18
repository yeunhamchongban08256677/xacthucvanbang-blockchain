// --- Global Variables ---
let contractAddress, contractABI;

// --- DOM Elements ---
const connectButton = document.getElementById('connectButton');
const headerGreeting = document.getElementById('header-greeting');
const headerTitle = document.getElementById('header-title');
const certsTbody = document.getElementById('certificates-tbody');
const sidebarNav = document.getElementById('sidebar-nav');
const sections = document.querySelectorAll('.main-section');
const issueButton = document.getElementById('issueButton');
const issueStatus = document.getElementById('issueStatus');
const revokeButton = document.getElementById('revokeButton');
const revokeStatus = document.getElementById('revokeStatus');
const logoutButton = document.getElementById('logoutButton');
const dashboardSearchInput = document.getElementById('dashboardSearchInput');

// --- State Variables ---
let provider, signer, contract, userAddress;
let allCertificates = [];

// --- Functions ---
const initializeApp = async () => {
    try {
        const response = await fetch('js/config.json');
        if (!response.ok) throw new Error("Không thể tải config.json");
        const config = await response.json();
        
        contractAddress = config.contractAddress;
        contractABI = config.contractABI;
        
        await initializeDashboard();
    } catch (error) {
        console.error("Lỗi nghiêm trọng khi khởi tạo:", error);
    }
};

const initializeDashboard = async () => {
    const loggedInUniData = localStorage.getItem('loggedInUniversity');
    if (!loggedInUniData) {
        alert("Vui lòng đăng nhập trước.");
        window.location.href = 'login.html';
        return;
    }
    const university = JSON.parse(loggedInUniData);
    headerGreeting.textContent = `Chào mừng, ${university.name}`;

    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        if (accounts.length > 0) {
            await setupDashboard(accounts[0], university);
        } else {
            connectButton.textContent = "Kết nối Ví để Tải dữ liệu";
            certsTbody.innerHTML = '<tr><td colspan="5" class="text-center p-5">Vui lòng nhấn "Kết nối Ví".</td></tr>';
        }
    } else {
        alert('Vui lòng cài đặt MetaMask.');
    }
};

const setupDashboard = async (accountAddress, universityData) => {
    userAddress = accountAddress.toLowerCase();
    if (userAddress !== universityData.walletAddress.toLowerCase()) {
        alert(`Lỗi: Ví đang kết nối không đúng. Vui lòng chuyển tài khoản trong MetaMask.`);
        connectButton.textContent = "Sai tài khoản!";
        return;
    }
    try {
        signer = await provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        connectButton.textContent = `Đã kết nối: ${userAddress.substring(0, 6)}...`;
        connectButton.disabled = true;
        await loadCertificates();
    } catch(error) {
        console.error("Lỗi khi thiết lập dashboard:", error);
    }
};

const handleManualConnect = async () => {
    try {
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts.length > 0) {
            const university = JSON.parse(localStorage.getItem('loggedInUniversity'));
            await setupDashboard(accounts[0], university);
        }
    } catch (error) {
        alert("Bạn đã từ chối kết nối ví.");
    }
};

const renderCertificateList = (certificates) => {
    if (certificates.length === 0) {
        certsTbody.innerHTML = '<tr><td colspan="5" class="text-center p-5">Không tìm thấy văn bằng nào.</td></tr>';
        return;
    }
    certsTbody.innerHTML = '';
    certificates.forEach(cert => {
        const graduationDate = new Date(Number(cert.details.graduationDate) * 1000).toLocaleDateString('vi-VN');
        const statusHtml = cert.details.isRevoked 
            ? `<span class="relative inline-block px-3 py-1 font-semibold text-red-900 leading-tight"><span aria-hidden class="absolute inset-0 bg-red-200 opacity-50 rounded-full"></span><span class="relative">Đã thu hồi</span></span>`
            : `<span class="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight"><span aria-hidden class="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span><span class="relative">Hợp lệ</span></span>`;
        const row = `<tr>
            <td class="px-5 py-4 border-b bg-white text-sm">${Number(cert.id)}</td>
            <td class="px-5 py-4 border-b bg-white text-sm">${cert.details.studentName}</td>
            <td class="px-5 py-4 border-b bg-white text-sm">${cert.details.major}</td>
            <td class="px-5 py-4 border-b bg-white text-sm">${graduationDate}</td>
            <td class="px-5 py-4 border-b bg-white text-sm">${statusHtml}</td>
        </tr>`;
        certsTbody.innerHTML += row;
    });
};

const loadCertificates = async () => {
    if (!contract || !userAddress) return;
    certsTbody.innerHTML = '<tr><td colspan="5" class="text-center p-5">Đang tải dữ liệu...</td></tr>';
    try {
        const certIds = await contract.getCertificatesByUniversity(userAddress);
        if (certIds.length === 0) {
             certsTbody.innerHTML = '<tr><td colspan="5" class="text-center p-5">Chưa có văn bằng nào được cấp.</td></tr>';
             return;
        }
        const certificatePromises = certIds.map(async (id) => {
            const details = await contract.getCertificateDetails(id);
            return { id: Number(id), details: details };
        });
        allCertificates = await Promise.all(certificatePromises);
        renderCertificateList(allCertificates);
    } catch (error) {
        console.error("Lỗi khi tải danh sách văn bằng:", error);
        certsTbody.innerHTML = '<tr><td colspan="5" class="text-center p-5 text-red-500">Lỗi tải dữ liệu.</td></tr>';
    }
};

const handleNavigation = (clickedLink) => {
    const targetId = clickedLink.getAttribute('href').substring(1);
    sections.forEach(section => section.classList.add('hidden'));
    document.getElementById(`${targetId}-section`).classList.remove('hidden');
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-gray-200', 'font-semibold', 'text-gray-700');
        link.classList.add('text-gray-600');
    });
    clickedLink.classList.add('bg-gray-200', 'font-semibold', 'text-gray-700');
    clickedLink.classList.remove('text-gray-600');
    headerTitle.textContent = clickedLink.querySelector('span').textContent;
};

const handleIssueCertificate = async () => {
     const studentAddress = document.getElementById('studentAddress').value;
     const studentName = document.getElementById('studentName').value;
     const major = document.getElementById('major').value;
     const classification = document.getElementById('classification').value;
     if (!ethers.isAddress(studentAddress)) return alert('Địa chỉ ví không hợp lệ.');
     if (!studentName || !major || !classification) return alert('Vui lòng điền đủ thông tin.');
     issueStatus.innerText = 'Đang xử lý...';
     try {
         const tx = await contract.issueCertificate(studentAddress, studentName, major, classification);
         await tx.wait();
         const nextId = await contract.getNextTokenId();
         issueStatus.innerText = `Cấp bằng thành công! ID mới: ${Number(nextId) - 1}`;
         await loadCertificates();
     } catch (error) {
         issueStatus.innerText = `Lỗi: ${error.message}`;
     }
};

const handleRevokeCertificate = async () => {
    const tokenId = document.getElementById('revokeTokenId').value;
    if (tokenId === '') return alert('Vui lòng nhập ID.');
    revokeStatus.innerText = 'Đang xử lý...';
    try {
        const tx = await contract.revokeCertificate(tokenId);
        await tx.wait();
        revokeStatus.innerText = `Thu hồi văn bằng ID ${tokenId} thành công!`;
        await loadCertificates();
    } catch (error) {
        revokeStatus.innerText = `Lỗi: ${error.message}`;
    }
};

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', initializeApp);
connectButton.addEventListener('click', handleManualConnect);
sidebarNav.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-link');
    if (link) {
        e.preventDefault();
        handleNavigation(link);
    }
});
issueButton.addEventListener('click', handleIssueCertificate);
revokeButton.addEventListener('click', handleRevokeCertificate);
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('loggedInUniversity');
    window.location.href = 'index.html';
});
dashboardSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    if (!allCertificates) return;
    const filteredCertificates = allCertificates.filter(cert =>
        cert.id.toString().includes(searchTerm) ||
        cert.details.studentName.toLowerCase().includes(searchTerm)
    );
    renderCertificateList(filteredCertificates);
});
