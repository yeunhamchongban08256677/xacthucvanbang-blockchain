// --- Global Variables ---
let contractAddress;
let contractABI;
let backendApiUrl;
let blockchainNodeUrl;

// --- DOM Elements ---
const searchForm = document.getElementById('searchForm');
const universitySelect = document.getElementById('universitySelect');
const tokenIdInput = document.getElementById('tokenId');
// Result containers
const loadingState = document.getElementById('loading-state');
const successState = document.getElementById('success-state');
const revokedState = document.getElementById('revoked-state');
const errorState = document.getElementById('error-state');
// Result details
const certificateDetailsDiv = document.getElementById('certificate-details');
const errorMessageP = document.getElementById('error-message');
const revokedMessageP = document.getElementById('revoked-message');

// --- State Variables ---
let provider, contract;

// --- Functions ---
const initializeApp = async () => {
    try {
        const response = await fetch('js/config.json');
        if (!response.ok) throw new Error("Không thể tải config.json");
        const config = await response.json();
        
        contractAddress = config.contractAddress;
        contractABI = config.contractABI;
        backendApiUrl = config.backendApiUrl;
        blockchainNodeUrl = config.blockchainNodeUrl;
        
        await initializeSearchPage();
    } catch (error) {
        console.error("Lỗi nghiêm trọng khi khởi tạo:", error);
    }
};

const initializeSearchPage = () => {
    provider = new ethers.JsonRpcProvider(blockchainNodeUrl); 
    contract = new ethers.Contract(contractAddress, contractABI, provider);
    
    loadUniversities();
    searchForm.addEventListener('submit', handleSearch);
};

const loadUniversities = async () => {
    try {
        const response = await fetch(`${backendApiUrl}/universities`);
        if (!response.ok) throw new Error('Lỗi máy chủ');
        const universities = await response.json();
        
        universitySelect.innerHTML = '<option value="">-- Vui lòng chọn trường --</option>';
        universities.forEach(uni => {
            const option = document.createElement('option');
            option.value = uni.walletAddress;
            option.textContent = uni.name;
            universitySelect.appendChild(option);
        });

    } catch(error) {
        console.error("Lỗi khi tải danh sách trường:", error);
        universitySelect.innerHTML = '<option value="">Không thể tải danh sách</option>';
    }
};

const hideAllStates = () => {
    loadingState.classList.add('hidden');
    successState.classList.add('hidden');
    revokedState.classList.add('hidden');
    errorState.classList.add('hidden');
};

const handleSearch = async (event) => {
    event.preventDefault();
    hideAllStates();
    loadingState.classList.remove('hidden');

    const selectedUniversityAddress = universitySelect.value.toLowerCase();
    const tokenId = tokenIdInput.value;

    if (!selectedUniversityAddress || tokenId === '') {
        hideAllStates();
        errorState.classList.remove('hidden');
        errorMessageP.textContent = 'Vui lòng chọn trường và nhập mã số văn bằng.';
        return;
    }

    try {
        const details = await contract.getCertificateDetails(tokenId);
        
        if (details.issuedBy.toLowerCase() !== selectedUniversityAddress) {
            hideAllStates();
            errorState.classList.remove('hidden');
            errorMessageP.textContent = `Văn bằng ID ${tokenId} tồn tại, nhưng không phải do trường đã chọn cấp.`;
            return;
        }

        if (details.isRevoked) {
            hideAllStates();
            revokedState.classList.remove('hidden');
            revokedMessageP.textContent = `Văn bằng ID ${tokenId} hợp lệ nhưng đã bị thu hồi.`;
            return;
        }

        const graduationDate = new Date(Number(details.graduationDate) * 1000).toLocaleDateString('vi-VN');
        certificateDetailsDiv.innerHTML = `
            <p><strong>Mã số:</strong> ${tokenId}</p>
            <p><strong>Sinh viên:</strong> ${details.studentName}</p>
            <p><strong>Ngành học:</strong> ${details.major}</p>
            <p><strong>Xếp loại:</strong> ${details.classification}</p>
            <p><strong>Ngày cấp:</strong> ${graduationDate}</p>
            <p><strong>Đơn vị cấp:</strong> ${universitySelect.options[universitySelect.selectedIndex].text}</p>
        `;
        hideAllStates();
        successState.classList.remove('hidden');

    } catch (error) {
        console.error("Lỗi khi tra cứu:", error);
        hideAllStates();
        errorState.classList.remove('hidden');
        errorMessageP.textContent = 'Không tìm thấy văn bằng hoặc có lỗi xảy ra.';
    }
};

// --- Event Listener ---
document.addEventListener('DOMContentLoaded', initializeApp);
