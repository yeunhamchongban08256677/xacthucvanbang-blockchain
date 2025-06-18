// --- Global Variables (sẽ được gán sau khi tải config) ---
let contractAddress;
let contractABI;
let backendApiUrl;

// --- DOM Elements ---
const connectButton = document.getElementById('connectButton');
const addUniversityButton = document.getElementById('addUniversityButton');
const addStatus = document.getElementById('addStatus');
const walletAddressInput = document.getElementById('walletAddress');
const universityNameInput = document.getElementById('universityName');
const universityListTbody = document.getElementById('university-list-tbody');
const searchInput = document.getElementById('searchInput');

// --- State Variables ---
let provider, signer, contract;
let allUniversities = [];

// --- Functions ---

/**
 * Hàm khởi tạo chính, chạy khi trang được tải
 * Tải file config, sau đó thiết lập ứng dụng.
 */
const initializeApp = async () => {
    try {
        // Bước 1: Tải file config.json trước tiên
        const response = await fetch('js/config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const config = await response.json();
        
        // Bước 2: Gán các giá trị config vào biến toàn cục
        contractAddress = config.contractAddress;
        contractABI = config.contractABI;
        backendApiUrl = config.backendApiUrl;
        
        // Bước 3: Tiếp tục logic khởi tạo như cũ
        if (typeof window.ethereum !== 'undefined') {
            provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_accounts", []);
            if (accounts.length > 0) {
                await setupAdminPage(accounts[0]);
            } else {
                connectButton.textContent = "Kết nối với quyền Admin";
            }
        } else {
            alert('Vui lòng cài đặt MetaMask.');
        }

    } catch (error) {
        console.error("Không thể tải file cấu hình hoặc khởi tạo ứng dụng:", error);
        alert("Lỗi nghiêm trọng: Không thể tải file cấu hình. Vui lòng kiểm tra Console (F12) và đảm bảo file config.json tồn tại.");
    }
};

/**
 * Hàm thiết lập chính sau khi có địa chỉ ví của Admin
 * @param {string} adminAddress - Địa chỉ ví đã kết nối
 */
const setupAdminPage = async (adminAddress) => {
    try {
        signer = await provider.getSigner();
        // Bây giờ biến contractAddress và contractABI đã có giá trị
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        const adminRole = await contract.DEFAULT_ADMIN_ROLE();
        const isAdmin = await contract.hasRole(adminRole, adminAddress);

        if (!isAdmin) {
            alert('Lỗi: Địa chỉ ví này không có quyền quản trị hệ thống!');
            connectButton.textContent = "Kết nối với quyền Admin";
            return;
        }

        connectButton.textContent = `Admin: ${adminAddress.substring(0, 6)}...`;
        connectButton.disabled = true;
        
        await loadUniversities();

    } catch (error) {
        console.error("Lỗi khi thiết lập trang Admin:", error);
        alert("Đã xảy ra lỗi khi kiểm tra quyền Admin.");
    }
};

/**
 * Xử lý khi người dùng nhấn nút kết nối thủ công
 */
const handleManualConnect = async () => {
    try {
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts.length > 0) {
            await setupAdminPage(accounts[0]);
        }
    } catch (error) {
        console.error("Người dùng từ chối kết nối.", error);
        alert("Bạn đã từ chối kết nối ví.");
    }
};


const renderUniversityList = (universities) => {
    if (universities.length === 0) {
        universityListTbody.innerHTML = '<tr><td colspan="3" class="text-center p-5 text-gray-500">Không tìm thấy trường nào.</td></tr>';
        return;
    }
    let tableContent = '';
    universities.forEach(uni => {
        tableContent += `
            <tr>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">${uni.name}</td>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm font-mono">${uni.walletAddress}</td>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                    <button class="revoke-btn text-red-600 hover:text-red-900" data-address="${uni.walletAddress}" data-name="${uni.name}">Thu hồi</button>
                </td>
            </tr>
        `;
    });
    universityListTbody.innerHTML = tableContent;
};

const loadUniversities = async () => {
    universityListTbody.innerHTML = '<tr><td colspan="3" class="text-center p-5 text-gray-500">Đang tải...</td></tr>';
    try {
        const response = await fetch(`${backendApiUrl}/universities`);
        if (!response.ok) throw new Error('Không thể tải danh sách trường.');
        allUniversities = await response.json();
        renderUniversityList(allUniversities);
    } catch(error) {
        console.error("Lỗi khi tải danh sách trường:", error);
        universityListTbody.innerHTML = '<tr><td colspan="3" class="text-center p-5 text-red-500">Lỗi khi tải danh sách.</td></tr>';
    }
};

const handleAddUniversity = async () => {
    const universityName = universityNameInput.value;
    const walletAddress = walletAddressInput.value.toLowerCase();
    if (!universityName) return alert('Vui lòng nhập tên trường.');
    if (!ethers.isAddress(walletAddress)) return alert('Địa chỉ ví không hợp lệ.');
    if (!contract) return alert('Vui lòng kết nối ví Admin trước.');
    addStatus.innerText = 'Đang xử lý...';
    try {
        addStatus.innerText = 'Bước 1/2: Đang cấp quyền trên Blockchain...';
        const universityRole = await contract.UNIVERSITY_ROLE();
        const tx = await contract.grantRole(universityRole, walletAddress);
        await tx.wait();
        addStatus.innerText = 'Bước 2/2: Đang lưu thông tin vào cơ sở dữ liệu...';
        const response = await fetch(`${backendApiUrl}/universities/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: universityName, walletAddress: walletAddress }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi lưu vào cơ sở dữ liệu.');
        }
        addStatus.innerText = `Thêm thành công trường ${universityName}!`;
        universityNameInput.value = '';
        walletAddressInput.value = '';
        await loadUniversities();
    } catch (error) {
        console.error("Lỗi khi thêm trường:", error);
        addStatus.innerText = `Lỗi: ${error.message}`;
    }
};

const handleRevokeRole = async (addressToRevoke, universityNameToRevoke) => {
    if (!contract) return alert('Vui lòng kết nối ví Admin trước.');
    if (!confirm(`Bạn có chắc chắn muốn thu hồi quyền của "${universityNameToRevoke}" không?`)) return;
    alert('Đang xử lý, vui lòng xác nhận trên MetaMask...');
    try {
        const universityRole = await contract.UNIVERSITY_ROLE();
        const tx = await contract.revokeRole(universityRole, addressToRevoke);
        await tx.wait();
        const response = await fetch(`${backendApiUrl}/universities/${addressToRevoke}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Lỗi khi xóa trường khỏi cơ sở dữ liệu.');
        alert(`Thu hồi quyền thành công của trường ${universityNameToRevoke}!`);
        await loadUniversities();
    } catch (error) {
        console.error("Lỗi khi thu hồi quyền:", error);
        alert(`Lỗi: ${error.message}`);
    }
};

// --- Event Listeners ---
// Đổi DOMContentLoaded để gọi hàm khởi tạo mới
document.addEventListener('DOMContentLoaded', initializeApp);
connectButton.addEventListener('click', handleManualConnect);
addUniversityButton.addEventListener('click', handleAddUniversity);

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredUniversities = allUniversities.filter(uni => 
        uni.name.toLowerCase().includes(searchTerm) || 
        uni.walletAddress.toLowerCase().includes(searchTerm)
    );
    renderUniversityList(filteredUniversities);
});

universityListTbody.addEventListener('click', (e) => {
    if (e.target.classList.contains('revoke-btn')) {
        const address = e.target.dataset.address;
        const name = e.target.dataset.name;
        handleRevokeRole(address, name);
    }
});
