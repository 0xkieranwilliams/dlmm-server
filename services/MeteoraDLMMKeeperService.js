class MeteoraDLMMKeeperService {
    static BASE_URL = "https://dlmm-api.meteora.ag"; 

    /**
     * Fetches overall protocol metrics, including:
     * - Total Value Locked (TVL)
     * - Daily trading volume
     * - Total trading volume
     * - Total collected fees
     * @returns {Promise<Array>} An array of protocol metrics objects.
     */
    static async getProtocolMetrics() {
        return this._fetch("/info/protocol_metrics");
    }

    /**
     * Retrieves all liquidity pairs.
     * @param {boolean} includeUnknown - Whether to include pools with unverified tokens (default: true).
     * @returns {Promise<Array>} A list of liquidity pairs.
     */
    static async getAllPairs(includeUnknown = true) {
        return this._fetch("/pair/all", { include_unknown: includeUnknown });
    }

    /**
     * Retrieves liquidity pairs grouped by categories, with optional filtering.
     * @param {Object} params - Optional query parameters (pagination, sorting, filtering).
     * @returns {Promise<Object>} Grouped liquidity pairs.
     */
    static async getAllPairsByGroups(params = {}) {
        return this._fetch("/pair/all_by_groups", params);
    }

    /**
     * Retrieves metadata for grouped liquidity pairs.
     * Includes details such as:
     * - Total TVL
     * - Trade volume
     * @param {Object} params - Optional query parameters.
     * @returns {Promise<Object>} Metadata for grouped pairs.
     */
    static async getAllPairsByGroupsMetadata(params = {}) {
        return this._fetch("/pair/all_by_groups_metadata", params);
    }

    /**
     * Retrieves all liquidity pairs with pagination support.
     * @param {Object} params - Pagination parameters (page, limit, sorting).
     * @returns {Promise<Object>} Paged liquidity pair data.
     */
    static async getAllPairsWithPagination(params = {}) {
        return this._fetch("/pair/all_with_pagination", params);
    }

    /**
     * Retrieves details about a specific liquidity pair using its token mint addresses.
     * 
     * Liquidity pairs are identified by the mint addresses of their two tokens, 
     * which are sorted in **lexical order** (alphabetical order of their addresses).
     * 
     * Example:
     * - If a pair consists of tokens with mint addresses:
     *   - `So11111111111111111111111111111111111111112`
     *   - `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
     * - The **lexical order** would be:
     *   ```
     *   EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v-So11111111111111111111111111111111111111112
     *   ```
     *
     * @param {string} lexicalOrderMints - The two token mint addresses sorted lexicographically, joined by a hyphen (`-`).
     * @returns {Promise<Object>} Information about the liquidity pair, including reserves, fees, and price data.
     */
    static async getSingleGroupPair(lexicalOrderMints) {
        return this._fetch(`/pair/group_pair/${lexicalOrderMints}`);
    }

    /**
     * Fetches information about a specific liquidity pair by address.
     * @param {string} pairAddress - The liquidity pair address.
     * @returns {Promise<Object>} Liquidity pair details.
     */
    static async getPair(pairAddress) {
        return this._fetch(`/pair/${pairAddress}`);
    }

    /**
     * Retrieves fee data (basis points) for a liquidity pair over a given time period.
     * @param {string} pairAddress - Liquidity pair address.
     * @param {number} numOfDays - Number of past days to include (max: 255).
     * @returns {Promise<Array>} Fee data for the period.
     */
    static async getPairFeeBpsByDays(pairAddress, numOfDays) {
        return this._fetch(`/pair/${pairAddress}/analytic/pair_fee_bps`, { num_of_days: numOfDays });
    }

    /**
     * Retrieves daily trade volume for a liquidity pair over a given period.
     * @param {string} pairAddress - Liquidity pair address.
     * @param {number} numOfDays - Number of past days to include (max: 255).
     * @returns {Promise<Array>} Trade volume history.
     */
    static async getPairDailyTradeVolumeByDays(pairAddress, numOfDays) {
        return this._fetch(`/pair/${pairAddress}/analytic/pair_trade_volume`, { num_of_days: numOfDays });
    }

    /**
     * Retrieves the TVL history for a liquidity pair.
     * @param {string} pairAddress - Liquidity pair address.
     * @param {number} numOfDays - Number of past days to include (max: 255).
     * @returns {Promise<Array>} TVL history.
     */
    static async getPairTvlByDays(pairAddress, numOfDays) {
        return this._fetch(`/pair/${pairAddress}/analytic/pair_tvl`, { num_of_days: numOfDays });
    }

    /**
     * Retrieves swap transactions for a liquidity pair.
     * @param {string} pairAddress - Liquidity pair address.
     * @param {number} rowsToTake - Number of swap records to retrieve (max: 255).
     * @returns {Promise<Array>} Swap history.
     */
    static async getPairSwapRecords(pairAddress, rowsToTake) {
        return this._fetch(`/pair/${pairAddress}/analytic/swap_history`, { rows_to_take: rowsToTake });
    }

    /**
     * Retrieves locked positions within a liquidity pair.
     * @param {string} pairAddress - Liquidity pair address.
     * @returns {Promise<Array>} Locked positions.
     */
    static async getPairPositionsLock(pairAddress) {
        return this._fetch(`/pair/${pairAddress}/positions_lock`);
    }

    /**
     * Fetches details of a liquidity position.
     * @param {string} positionAddress - Position address.
     * @returns {Promise<Object>} Position details.
     */
    static async getPosition(positionAddress) {
        return this._fetch(`/position/${positionAddress}`);
    }

    /**
     * Retrieves claimed fees for a position.
     * @param {string} positionAddress - Position address.
     * @returns {Promise<Array>} List of claimed fees.
     */
    static async getClaimFees(positionAddress) {
        return this._fetch(`/position/${positionAddress}/claim_fees`);
    }

    /**
     * Retrieves claimed rewards for a position.
     * @param {string} positionAddress - Position address.
     * @returns {Promise<Array>} List of claimed rewards.
     */
    static async getClaimRewards(positionAddress) {
        return this._fetch(`/position/${positionAddress}/claim_rewards`);
    }

    /**
     * Retrieves deposits for a position.
     * @param {string} positionAddress - Position address.
     * @returns {Promise<Array>} Deposit history.
     */
    static async getDeposits(positionAddress) {
        return this._fetch(`/position/${positionAddress}/deposits`);
    }

    /**
     * Retrieves withdrawal transactions for a position.
     * @param {string} positionAddress - Position address.
     * @returns {Promise<Array>} Withdrawal history.
     */
    static async getWithdraws(positionAddress) {
        return this._fetch(`/position/${positionAddress}/withdraws`);
    }

    /**
     * Fetches details of a liquidity position using API version 2.
     * @param {string} positionAddress - Position address.
     * @returns {Promise<Object>} Position details.
     */
    static async getPositionV2(positionAddress) {
        return this._fetch(`/position_v2/${positionAddress}`);
    }

    /**
     * Retrieves earnings (fees & rewards) for a wallet in a specific liquidity pair.
     * @param {string} walletAddress - Wallet address.
     * @param {string} pairAddress - Liquidity pair address.
     * @returns {Promise<Array>} Wallet earnings.
     */
    static async getWalletEarning(walletAddress, pairAddress) {
        return this._fetch(`/wallet/${walletAddress}/${pairAddress}/earning`);
    }

    /**
     * Internal method to handle API requests.
     * @param {string} endpoint - API endpoint.
     * @param {Object} params - Query parameters.
     * @returns {Promise<Object|Array>} API response.
     */
    static async _fetch(endpoint, params = {}) {
        const url = new URL(`${this.BASE_URL}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        try {
            const response = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
            if (!response.ok) throw new Error(`API Error ${response.status}: ${await response.text()}`);
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }
}

module.exports = MeteoraDLMMKeeperService;
