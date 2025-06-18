// Import các thư viện cần thiết
// Thêm 'network' từ hardhat để biết chúng ta đang chạy trên mạng nào
const { ethers, network } = require("hardhat"); 
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Triển khai hợp đồng với tài khoản:", deployer.address);

    const Certificate = await ethers.getContractFactory("Certificate");
    
    console.log("Đang triển khai hợp đồng...");
    const certificateContract = await Certificate.deploy();
    
    await certificateContract.waitForDeployment();
    
    const contractAddress = certificateContract.target;
    console.log("Hợp đồng Certificate đã được triển khai tới địa chỉ:", contractAddress);

    // --- PHẦN TỰ ĐỘNG CẬP NHẬT FILE CONFIG ---

    // 1. Lấy ABI từ file artifact
    const abiDir = path.resolve(__dirname, "../artifacts/contracts/Certificate.sol/Certificate.json");
    const abiFile = JSON.parse(fs.readFileSync(abiDir, "utf8"));
    const contractABI = abiFile.abi;

    // 2. ĐÃ CẬP NHẬT: Xác định các URL cấu hình dựa trên tên mạng
    const isTestNetwork = network.name === "test";
    // Thay đổi IP này nếu IP nội bộ của bạn thay đổi
    const lanIpAddress = "192.168.1.14"; 

    console.log(`Đang tạo file config.json cho mạng: '${network.name}'`);

    const configData = {
      contractAddress: contractAddress,
      contractABI: contractABI,
      backendApiUrl: isTestNetwork ? `http://${lanIpAddress}:3000/api` : "http://localhost:3000/api",
      blockchainNodeUrl: isTestNetwork ? `http://${lanIpAddress}:7545` : "http://127.0.0.1:7545"
    };

    // 3. Chuyển đối tượng thành chuỗi JSON được định dạng đẹp
    const configContent = JSON.stringify(configData, null, 2);

    // 4. Ghi nội dung mới vào file config.json ở thư mục gốc
    const configDir = path.resolve(__dirname, "../js/config.json");
    fs.writeFileSync(configDir, configContent);

    console.log("Đã tự động cập nhật file 'config.json' thành công!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
