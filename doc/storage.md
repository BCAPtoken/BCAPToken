# Blockchain Capital Token Smart Contract: Storage

This document describes storage structure of Blockchain Capital Token Smart
Contract.

## 1. tokenIssuer

### Signature

    address tokenIssuer

### Description

Token issuer address.

### Read in use cases

* ERC-20:TotalSupply
* ERC-20:BalanceOf

### Modified in use cases

* Administration:Deploy

## 2. accounts

### Signature

    mapping (address => uint256) accounts

### Description

If `owner` is not the token issuer address, value of `accounts [owner]` is the number of tokens currently belonging to the owner of address `owner`.  If `owner` is token issuer address, value of `accounts [owner]` is maximum allowed number of tokens in circulation minus number of tokens currently in circulation or in other words, the number of tokens that still may be issued.

### Read in use cases

* ERC-20:TotalSupply
* ERC-20:BalanceOf
* ERC-20:Transfer
* ERC-20:TransferFrom

### Modified in use cases

* ERC-20:Transfer
* ERC-20:TransferFrom
* Administration:Deploy

## 3. allowances

### Signature

    mapping (address => mapping (address => uint256)) allowances

### Description

Value of `allowances [_owner][_spender]` is how many tokens belonging to the owner of address _owner the owner of address _spender is currently allowed to transfer.

### Read in use cases

* ERC-20:TransferFrom
* ERC-20:Allowance

### Modified in use cases

* ERC-20:TransferFrom
* ERC-20:Approve

## 4. owner

### Signature

    address owner

### Description

Address of the owner of smart contract.

### Read in use cases

* Administration:Freeze
* Administraction:Unfreeze

### Modifier in use cases

* Administration:Deploy

## 5. transfersFrozen

### Signature

    bool transfersFrozen

### Description

Whether transfers are currently frozen or not.

### Read in use cases

* ERC-20:Transfer
* ERC-20:TransferFrom
* ERC-20:Freeze
* ERC-20:Unfreeze

### Modifier in use cases

* ERC-20:Freeze
* ERC-20:Unfreeze
