// --- Global Variables (sẽ được gán sau khi tải config) ---
let contractAddress;
let contractABI;
let backendApiUrl;

// --- DOM Elements ---
const loginRoleSelect = document.getElementById('loginRole');
const universityLoginForm = document.getElementById('university-login-form');
const adminLoginForm = document.getElementById('admin-login-form');
const universityLoginButton = document.getElementById('universityLoginButton');
const adminLoginButton = document.getElementById('adminLoginButton');
const loginStatus = document.getElementById('loginStatus');

// --- Functions ---

/**
 * Hàm khởi tạo chính
 */
const initializeApp = async () => {
    try {
        const response = await fetch('js/config.json');
        if (!response.ok) throw new Error("Không thể tải config.json");
        const config = await response.json();
        
        contractAddress = config.contractAddress;
        contractABI = config.contractABI;
        backendApiUrl = config.backendApiUrl;

    } catch (error) {
        console.error("Lỗi nghiêm trọng khi khởi tạo:", error);
        loginStatus.textContent = "Lỗi tải cấu hình hệ thống.";
    }
};

const handleRoleChange = () => {
    const selectedRole = loginRoleSelect.value;
    loginStatus.textContent = ''; 

    if (selectedRole === 'admin') {
        universityLoginForm.classList.add('hidden');
        adminLoginForm.classList.remove('hidden');
    } else {
        adminLoginForm.classList.add('hidden');
        universityLoginForm.classList.remove('hidden');
    }
};

const handleAdminLogin = async () => {
    if (typeof window.ethereum === 'undefined') return alert('Vui lòng cài đặt MetaMask!');

    loginStatus.textContent = 'Vui lòng xác nhận kết nối trên MetaMask...';
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        loginStatus.textContent = 'Đang xác thực quyền Admin...';
        const adminRole = await contract.DEFAULT_ADMIN_ROLE();
        const isAdmin = await contract.hasRole(adminRole, userAddress);

        if (isAdmin) {
            loginStatus.textContent = 'Xác thực Admin thành công! Đang chuyển hướng...';
            window.location.href = 'addsite.html';
        } else {
            loginStatus.textContent = 'Lỗi: Địa chỉ ví này không có quyền quản trị hệ thống.';
        }
    } catch (error) {
        console.error("Lỗi khi đăng nhập Admin:", error);
        loginStatus.textContent = 'Đã xảy ra lỗi. Vui lòng thử lại.';
    }
};

const handleUniversityLogin = async () => {
    if (typeof window.ethereum === 'undefined') return alert('Vui lòng cài đặt MetaMask!');

    loginStatus.textContent = 'Vui lòng xác nhận kết nối trên MetaMask...';
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = (await signer.getAddress()).toLowerCase();

        loginStatus.textContent = 'Đang xác thực thông tin trường...';
        const response = await fetch(`${backendApiUrl}/university/${userAddress}`);

        if (response.ok) {
            const universityData = await response.json();
            loginStatus.textContent = `Chào mừng ${universityData.name}! Đang chuyển hướng...`;
            
            localStorage.setItem('loggedInUniversity', JSON.stringify({
                name: universityData.name,
                walletAddress: userAddress 
            }));
            window.location.href = 'dashboard.html';

        } else {
            loginStatus.textContent = 'Lỗi: Địa chỉ ví này chưa được đăng ký cho bất kỳ trường nào.';
        }
    } catch (error) {
        console.error("Lỗi khi kết nối ví:", error);
        loginStatus.textContent = 'Đã xảy ra lỗi khi kết nối ví. Vui lòng thử lại.';
    }
};

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', initializeApp);
loginRoleSelect.addEventListener('change', handleRoleChange);
adminLoginButton.addEventListener('click', handleAdminLogin);
universityLoginButton.addEventListener('click', handleUniversityLogin);
