require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;

if (!SEPOLIA_RPC_URL || !PRIVATE_KEY) {
  console.warn("CẢNH BÁO: Vui lòng tạo file .env và điền SEPOLIA_RPC_URL và PRIVATE_KEY.");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    // sepolia: {
    //   url: SEPOLIA_RPC_URL || "",
    //   accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    //   chainId: 11155111,
    // },
    // Mạng để phát triển trên máy cá nhân với Ganache
    localhost: {
      url: "HTTP://127.0.0.1:7545", // ĐÃ SỬA LỖI: Thêm dấu phẩy ở đây
      chainId: 1337
    },

    test: {
      url: "HTTP://192.168.1.14:7545", // ĐÃ SỬA LỖI: Thêm dấu phẩy ở đây
      chainId: 1337
    },


  },
};
