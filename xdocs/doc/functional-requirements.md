# Blockchain Capital Token Smart Contract: Functional Requirements

This document summarizes functional requirements for Blockchain Capital Token Smart
Contract.

## 0. Introduction

Blockchain Capital Token Smart Contract is an [ERC-20](https://github.com/ethereum/EIPs/issues/20) compliant [Ethereum](https://ethereum.org) smart contract that manages Blockchain Capital Tokens - lightweight cryptocurrency whose units represents shares in Blockchain Capital investment fund.
The following sections of this document describe functional requirements for Blockchain Capital Token Smart Contract.

## 1. Use Cases

This sections describes use cases for Blockchain Capital Token Smart Contract.
Related use cases are grouped into following functional.

### 1.1. ERC-20 Functional Block

This functional block contains use cases required by [ERC-20](https://github.com/ethereum/EIPs/issues/20) standard.

#### 1.1.1. ERC-20:TotalSupply

**Actors**: *User*, *Smart Contract*

**Goal:** *User* wants to know how many tokens are currently in circulation

##### Main Flow:

1. *User* calls constant method on *Smart Contract*
2. *Smart Contract* returns to *User* total number of tokens in circulation

#### 1.1.2. ERC-20:BalanceOf

**Actors**: *User*, *Smart Contract*

**Goal:** *User* wants to know how many tokens are currently belonging to the owner of certain address

##### Main Flow:

1. *User* calls constant method on *Smart Contract* providing the following information as method parameters: address to get number of tokens currently belonging to the owner of
2. *Smart Contract* returns to *User* number of tokens currently belonging to the owner of given address

#### 1.1.3. ERC-20:Transfer

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to transfer some of his tokens to the owner of certain address

##### Main Flow:

1. *User* calls method on *Smart Contract* providing the following information as method parameters: address to transfer tokens to the owner of and number of tokens to transfer
2. Token transfers are not currently frozen
3. *User* is not token issuer
4. There are enough tokens currently belonging to *User*
5. Destination address is not token issuer address
6. *Smart Contract* transfers requested number of tokens from *User* to the owner of given address
7. Some tokens actually did change hands during the transfer, i.e. destination address was not the same as *User*'s own address and number of tokens transferred is greater than zero
8. *Smart Contract* logs tokens transfer event with the following information: address tokens were transferred from the owner of, address tokens were transferred to the owner of, and number of tokens transferred
9. *Smart Contract* returns success indicator to *User*

##### Exceptional Flow #1:

1. Same as in Main Flow
2. Token transfers are currently frozen
3. *Smart Contract* returns error indicator to *User*

##### Exceptional Flow #2:

1. Same as in Main Flow
2. Same as in Main Flow
3. *User* is token issuer
4. Number of tokens currently in circulation plus number of tokens to transfer is not greater than maximum allowed number of tokens in circulation
5. Destination address in not token issuer address
6. *Smart Contract* creates as many new tokens as many tokens are to be transferred
7. *Smart Contract* transfers newly created tokens to the owner of given address
8. Some tokens were actually created, i.e. number of tokens created is greater than zero
9. *Smart Contract* logs tokens transfer event with the following information: token issuer address as source address, address tokens were transferred to the owner of, and number of tokens transferred
10. *Smart Contract* returns success indicator to *User*

##### Exceptional Flow #3:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Exceptional Flow #2
4. Number of tokens currently in circulation plus number of tokens to transfer is greater than maximum allowed number of tokens in circulation
5. *Smart Contract* returns error indicator to *User*

##### Exceptional Flow #4:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Exceptional Flow #2
4. Same as in Exceptional Flow #2
5. Destination address in token issuer address
6. *Smart Contract* returns success indicator to *User*

##### Exceptional Flow #5:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Exceptional Flow #2
4. Same as in Exceptional Flow #2
5. Same as in Exceptional Flow #2
6. Same as in Exceptional Flow #2
7. Same as in Exceptional Flow #2
8. No tokens were actually created, i.e. number of tokens created is zero
9. *Smart Contract* returns success indicator to *User*

##### Exceptional Flow #6:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. There is not enough tokens currently belonging to *User*
5. *Smart Contract* returns error indicator to *User*

##### Exceptional Flow #7:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Destination address is token issuer address
6. *Smart Contract* destroys as many tokens belonging to *User* as many tokens are to be transferred
7. Some tokens actually were destroyed, i.e. number of tokens destroyed is greater than zero
8. *Smart Contract* logs tokens transfer event with the following information: *User* address as source address, token issuer address as destination address, and number of tokens destroyed
9. *Smart Contract* returns success indicator to *User*

##### Exceptional Flow #8:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Same as in Exceptional Flow #7
6. Same as in Exceptional Flow #7
7. No tokens were actually destroyed, i.e. number of tokens destroyed is zero
8. *Smart Contract* returns success indicator to *User*

##### Exceptional Flow 9:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Same as in Main Flow
6. Same as in Main Flow
7. No tokens actually did change hands during the transfer, i.e. destination address was *User*'s own address, or number of tokens transferred was zero
8. *Smart Contract* returns success indicator to *User*

#### 1.1.4. ERC-20:TransferFrom

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to transfer some of the tokens currently belonging to the owner of certain source address to the owner of certain destination address

##### Main Flow:

1. *User* calls method on *Smart Contract* providing the following information as method parameters: source address, destination address, and number of tokens to transfer
2. Token transfers are not currently frozen
3. *User* is currently allowed to transfer requested number of tokens from the owner of source address
4. Source address is not token issuer address
5. There are enough tokens currently belonging to the owner of source address
6. Destination address is not token issuer address
7. *Smart Contract* transfers requested number of tokens from the owner of source address to the owner of destination address
8. *Smart Contract* decreases by the number of tokens transferred the number of tokens *User* is allowed to transfer from the owner of source address
9. Some tokens actually did change hands during the transfer, i.e. destination address was not the same as source address and number of tokens transferred was greater than zero
10. *Smart Contract* logs token transfer event with the following information: source address, destination address, and number of tokens transferred
11. *Smart Contract* returns success indicator to *User*

##### Exceptional Flow #1:

1. Same as in Main Flow
2. Token transfers are currently frozen
3. *Smart Contract* returns error indicator to *User*

##### Exceptional Flow #2:

1. Same as in Main Flow
2. Same as in Main Flow
3. *User* is not currently allowed to transfer requested number of tokens from the owner of source address
4. *Smart Contract* returns error indicator to *User*

##### Exceptional flow #3:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Source address is token issuer address
5. Number of tokens currently in circulation plus number of tokens to transfer is not greater than maximum allowed number of tokens in circulation
6. Destination address is not token issuer address
7. *Smart Contract* creates as many new tokens as many tokens are to be transferred
8. *Smart Contract* transfers newly created tokens to the owner of given address
9. *Smart Contract* decreases by the number of tokens created the number of tokens *User* is allowed to transfer from the owner of source address
10. Some tokens were actually created, i.e. number of tokens created is greater than zero
11. *Smart Contract* logs token transfer event with the following information: source address, destination address, and number of tokens transferred
12. *Smart Contract* returns success indicator to *User*

##### Exceptional Flow #4:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Exceptional Flow #3
5. Number of tokens currently in circulation plus number of tokens to transfer is greater than maximum allowed number of tokens in circulation
6. *Smart Contract* returns error indicator to *User*

##### Exceptional Flow #5:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Exceptional Flow #3
5. Same as in Exceptional Flow #3
6. Destination address is token issuer address
7. *Smart Contract* returns success indicator to *User*

##### Exceptional Flow #6:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Exceptional Flow #3
5. Same as in Exceptional Flow #3
6. Same as in Exceptional Flow #3
7. Same as in Exceptional Flow #3
8. Same as in Exceptional Flow #3
9. Same as in Exceptional Flow #3
10. No tokens were actually created, i.e. number of tokens created is zero
11. *Smart Contract* returns success indicator to *User*

##### Exceptional Flow #7:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. There are not enough tokens currently belonging to the owner of source address
6. *Smart Contract* returns error indicator to *User*

##### Exceptional Flow #8:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Same as in Main Flow
6. Destination address is token issuer address
7. *Smart Contract* destroys as many tokens belonging to *User* as many tokens are to be transferred
8. *Smart Contract* decreases by the number of tokens destroyed the number of tokens *User* is allowed to transfer from the owner of source address
9. Some tokens actually were destroyed, i.e. number of tokens destroyed is greater than zero
10. *Smart Contract* logs tokens transfer event with the following information: source address, destination address, and number of tokens destroyed
11. *Smart Contract* returns success indicator to *User*

##### Exceptional Flow #9:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Same as in Main Flow
6. Same as in Exceptional Flow #8
7. Same as in Exceptional Flow #8
8. Same as in Exceptional Flow #8
9. No tokens were actually destroyed, i.e. number of tokens destroyed is zero
10. *Smart Contract* returns success indicator to *User*

##### Exceptional Flow #10:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Same as in Main Flow
6. same as in Main Flow
7. same as in Main Flow
8. same as in Main Flow
9. No tokens actually did change hands during the transfer, i.e. destination address was the same as source address or number of tokens transferred was zero
10. *Smart Contract* returns success indicator to *User*

#### 1.1.5. ERC-20:Approve

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to set how many tokens belonging to *User* the owner of certain address is allowed to transfer

##### Main Flow:

1. *User* calls method on *Smart Contract* providing the following information as method parameters: address to allow the owner of to transfer tokens belonging to *User and number of tokens to allow transfer of
2. *Smart Contract* set the number of tokens belonging to *User* the owner of given address is allowed to transfer
3. *Smart Contract* logs token transfer approval event with the following information: *User*'s address, address the owner of was allowed to transfer tokens belonging to *User*, and number of tokens the transfer was allowed of
4. *Smart Contract* returns success indicator to *User*

#### 1.1.6. ERC-20:Allowance

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to know how many tokens belonging to the owner of certain source address the owner of certain spender address is currently allowed to transfer

##### Main Flow:

1. *User* calls constant method on *Smart Contract* providing the following information as method parameters: source address and spender address
2. *Smart Contract* returns to *User* the number of tokens belonging to the owner of source address the owner of spender address is currently allowed to transfer

### 1.2. Administration Functional Block

This functional block contains use cases related to smart contract administration.

#### 1.2.1. Administration:Deploy

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to deploy *Smart Contract* with certain token issuer address

##### Main Flow:

1. *User* deploys *Smart Contract* providing the following information as constructor arguments: token issuer address
2. *Smart Contract* remember given token issuer address

#### 1.2.2. Administration:Freeze

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to freeze token transfers

##### Main Flow:

1. *User* calls method on *Smart Contract*
2. *User* is the owner of *Smart Contract*
3. Token transfers are not currently frozen
4. *Smart Contract* freezes token transfer
5. *Smart Contract* logs token transfers freeze event

##### Exceptional Flow #1:

1. Same as in Main Flow
2. *User* is not the owner of *Smart Contract*
3. *Smart Contract cancels transaction

##### Exceptional Flow #2:

1. Same as in Main Flow
2. Same as in Main Flow
3. Token transfers are currently frozen
4. *Smart Contract* does nothing

#### 1.2.3. Administration:Unfreeze

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to unfreeze token transfers

##### Main Flow:

1. *User* calls method on *Smart Contract*
2. *User* is the owner of *Smart Contract*
3. Token transfers are currently frozen
4. *Smart Contract* unfreezes token transfer
5. *Smart Contract* logs token transfers unfreeze event

##### Exceptional Flow #1:

1. Same as in Main Flow
2. *User* is not the owner of *Smart Contract*
3. *Smart Contract cancels transaction

##### Exceptional Flow #2:

1. Same as in Main Flow
2. Same as in Main Flow
3. Token transfers are not currently frozen
4. *Smart Contract* does nothing

## 2. Limits

The following limits are established:

Limit                                   | Value
--------------------------------------- | -------
Maximum number of tokens in circulation | 2^256-1
