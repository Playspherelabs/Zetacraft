// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@zetachain/toolkit/contracts/OnlySystem.sol";

contract NFT is zContract, ERC721, OnlySystem, Ownable {
    SystemContract public systemContract;
    error CallerNotOwnerNotApproved();
    uint256 constant BITCOIN = 18332;

    mapping(uint256 => uint256) public tokenAmounts;
    mapping(uint256 => uint256) public tokenChains;
    mapping(uint256 => Metadata) public metadatas;
    mapping(uint256 => mapping(uint256 => bytes32)) public recipes;
    mapping(address => uint256) public recipePoints;
    mapping(address => uint256) public mintPoints;
    mapping(address => uint256) public recipeCreatorPoints;
    mapping(address => uint256) public refferalRecipeCreatorPoints;

    uint256 public constant MINT_POINT = 400;
    uint256 public constant RECIPE_CREATOR_POINT = 100;
    uint256 public constant REFFERAL_RECIPE_CREATOR_POINT = 50;
    uint256 private _nextTokenId;

    event MintPoint(address indexed _to, uint256 _point);
    event RecipeCreatorPoint(address indexed _to, uint256 _point);
    event RefferalRecipeCreatorPoint(address indexed _to, uint256 _point);
    event Minted(address indexed _to, uint256 indexed _id, uint256 _idA, uint256 _idB);
    event RecipePoint(address indexed _to, uint256 _point);
    event RecipeCreated(address indexed _creator, uint256 indexed _id, string _name, string _imageText, uint256 _idA, uint256 _idB);

    struct Metadata {
        string name;
        string imageText;
        address creator;
    }

    constructor(address systemContractAddress) ERC721("MyNFT", "MNFT") {
        systemContract = SystemContract(systemContractAddress);
        _nextTokenId = 0;
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlySystem(systemContract) {
        address recipient;

        if (context.chainID == BITCOIN) {
            recipient = BytesHelperLib.bytesToAddress(message, 0);
        } else {
            recipient = abi.decode(message, (address));
        }

        _mintNFT(recipient, context.chainID, amount);
    }

    function _mintNFT(
        address recipient,
        uint256 chainId,
        uint256 amount
    ) private {
        uint256 tokenId = _nextTokenId;
        _safeMint(recipient, tokenId);
        tokenChains[tokenId] = chainId;
        tokenAmounts[tokenId] = amount;
        _nextTokenId++;

        mintPoints[recipient] += MINT_POINT;
        emit MintPoint(recipient, MINT_POINT);
    }

    function burnNFT(uint256 tokenId, bytes memory recipient) public {
        if (!_isApprovedOrOwner(_msgSender(), tokenId)) {
            revert CallerNotOwnerNotApproved();
        }
        address zrc20 = systemContract.gasCoinZRC20ByChainId(tokenChains[tokenId]);

        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFee();

        IZRC20(zrc20).approve(zrc20, gasFee);
        IZRC20(zrc20).withdraw(recipient, tokenAmounts[tokenId] - gasFee);

        _burn(tokenId);
        delete tokenAmounts[tokenId];
        delete tokenChains[tokenId];
    }

    function setRecipe(
        uint256 _id,
        string memory _name,
        string memory _imageText,
        uint256 _idA,
        uint256 _idB
    ) external onlyOwner {
        _setRecipe(_id, _idA, _idB);
        _setMetaData(_id, _name, _imageText, msg.sender);
        _mint(msg.sender, _id);
        recipePoints[msg.sender] += RECIPE_CREATOR_POINT;
        emit RecipePoint(msg.sender, RECIPE_CREATOR_POINT);
        emit RecipeCreated(msg.sender, _id, _name, _imageText, _idA, _idB);
    }

    function _setMetaData(uint256 _id, string memory _name, string memory _imageText, address _creator) internal {
        if (isMetadataExists(_id)) {
            revert("ZetaRecipe: token already exists");
        }

        metadatas[_id] = Metadata(_name, _imageText, _creator);
    }

    function isMetadataExists(uint256 _id) public view returns (bool) {
        return bytes(metadatas[_id].name).length != 0;
    }

    function _setRecipe(uint256 _id, uint256 _idA, uint256 _idB) internal {
        if (_idA > _idB) {
            revert("ZetaRecipe: idA must be less than idB");
        }

        if (isRecipeExists(_id)) {
            revert("ZetaRecipe: recipe already exists");
        }

        if (!isMetadataExists(_idA) || !isMetadataExists(_idB)) {
            revert("ZetaRecipe: metadata does not exist");
        }

        recipes[_id][_idA] = keccak256(abi.encodePacked(_id, _idA, _idB));
    }

    function isRecipeExists(uint256 _id) public view returns (bool) {
        return recipes[_id][_id] != bytes32(0);
    }
}
