// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Certificate is ERC721, AccessControl {
    bytes32 public constant UNIVERSITY_ROLE = keccak256("UNIVERSITY_ROLE");

    uint256 private _nextTokenId;

    struct CertificateDetails {
        string studentName;
        string major;
        uint256 graduationDate;
        string classification;
        bool isRevoked;
        address issuedBy;
    }

    mapping(uint256 => CertificateDetails) private _certificateDetails;
    mapping(address => uint256[]) private _certificatesByUniversity;

    constructor()
        ERC721("University Certificate", "Ucert")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UNIVERSITY_ROLE, msg.sender);
    }

    function issueCertificate(
        address studentAddress,
        string memory studentName,
        string memory major,
        string memory classification
    ) public onlyRole(UNIVERSITY_ROLE) {
        uint256 newItemId = _nextTokenId;
        _nextTokenId++;

        _safeMint(studentAddress, newItemId);

        _certificateDetails[newItemId] = CertificateDetails(
            studentName,
            major,
            block.timestamp,
            classification,
            false,
            msg.sender
        );

        _certificatesByUniversity[msg.sender].push(newItemId);
    }

    function revokeCertificate(uint256 tokenId) public onlyRole(UNIVERSITY_ROLE) {
        require(_certificateDetails[tokenId].graduationDate != 0, "Certificate: nonexistent token");
        require(_certificateDetails[tokenId].issuedBy == msg.sender, "Certificate: sender is not the issuer");
        _certificateDetails[tokenId].isRevoked = true;
    }

    function getCertificatesByUniversity(address _university)
        public
        view
        returns (uint256[] memory)
    {
        return _certificatesByUniversity[_university];
    }

    function getCertificateDetails(uint256 tokenId)
        public
        view
        returns (CertificateDetails memory)
    {
        require(_certificateDetails[tokenId].graduationDate != 0, "Certificate: query for nonexistent token");
        return _certificateDetails[tokenId];
    }

    
    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
