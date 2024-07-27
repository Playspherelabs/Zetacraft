// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@zetachain/toolkit/contracts/OnlySystem.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract NFT is zContract, ERC721URIStorage, OnlySystem, Ownable {
    using Strings for uint256;

    SystemContract public systemContract;
    error CallerNotOwnerNotApproved();
    uint256 constant BITCOIN = 18332;

    mapping(uint256 => uint256) public tokenAmounts;
    mapping(uint256 => uint256) public tokenChains;
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

    struct Recipe {
        uint256 id1;
        uint256 id2;
        string name;
        string emojiName;
        address creator;
    }

    uint256 public nextRecipeId = 1;
    mapping(uint256 => Recipe) public recipes;
    mapping(uint256 => mapping(uint256 => uint256)) public recipeIdByIngredients;
    mapping(address => uint256) public lastFaucetRequest;
    mapping(address => uint256[]) public userRecipes;

    constructor(address systemContractAddress) ERC721("Zetacraft", "ZetaRecipe") {
        systemContract = SystemContract(systemContractAddress);
        _nextTokenId = 0;
    }

    event RecipeCreated(
        uint256 indexed recipeId, uint256 id1, uint256 id2, string name, string emojiName, address creator
    );

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

    function createRecipe(uint256 _id1, uint256 _id2, string memory _name, string memory _emojiName) external {
        require(_id1 != _id2, "Ingredients must be different");
        require(recipeIdByIngredients[_id1][_id2] == 0, "Recipe already exists");

        uint256 recipeId = nextRecipeId++;
        recipes[recipeId] = Recipe(_id1, _id2, _name, _emojiName, msg.sender);
        recipeIdByIngredients[_id1][_id2] = recipeId;
        recipeIdByIngredients[_id2][_id1] = recipeId; // Store recipe for both ingredient orders

        _safeMint(msg.sender, recipeId);
        userRecipes[msg.sender].push(recipeId);

        // Generate and set metadata
        string memory tokenURI = generateTokenURI(recipeId);
        _setTokenURI(recipeId, tokenURI);

        emit RecipeCreated(recipeId, _id1, _id2, _name, _emojiName, msg.sender);
    }

    function generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        Recipe memory recipe = recipes[tokenId];
        bytes memory dataURI = abi.encodePacked(
            '{',
            '"name": "', recipe.name, '",',
            '"description": "Zetacraft Recipe",',
            '"image": "', recipe.emojiName, '",',
            '"attributes": [',
            '{"trait_type": "Ingredient 1", "value": "', recipe.id1.toString(), '"},',
            '{"trait_type": "Ingredient 2", "value": "', recipe.id2.toString(), '"},',
            '{"trait_type": "Creator", "value": "', uint256(uint160(recipe.creator)).toHexString(20), '"}',
            ']',
            '}'
        );
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(dataURI)
            )
        );
    }

    function getRecipe(uint256 _recipeId) external view returns (Recipe memory) {
        return recipes[_recipeId];
    }

    function getRecipeIdByIngredients(uint256 _id1, uint256 _id2) external view returns (uint256) {
        return recipeIdByIngredients[_id1][_id2];
    }

    function getUserRecipes(address _user) external view returns (uint256[] memory) {
        return userRecipes[_user];
    }

    function getAllRecipes() external view returns (Recipe[] memory) {
        Recipe[] memory allRecipes = new Recipe[](nextRecipeId - 1);
        for (uint256 i = 1; i < nextRecipeId; i++) {
            allRecipes[i - 1] = recipes[i];
        }
        return allRecipes;
    }
}