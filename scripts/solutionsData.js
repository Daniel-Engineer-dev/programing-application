// Dữ liệu lời giải mẫu (đúng thuật toán, khớp signature defaultCode.cpp) cho 30 bài đầu tiên.
// Mỗi bài có 1-2 "variant" code thật sự đúng; script seed sẽ nhân bản thành nhiều bài đăng
// (khác tiêu đề/author/thời gian) để mô phỏng nhiều thành viên cộng đồng cùng đăng lời giải.

const SOLUTIONS = {
  "100-reverse-nodes-in-k-group": [
    {
      title: "Đảo ngược nhóm k node bằng vòng lặp (Iterative)",
      content:
        "Dùng dummy node, mỗi lần kiểm tra đủ k node phía trước rồi đảo ngược tại chỗ bằng 3 con trỏ prev/curr/next. Độ phức tạp O(n), không dùng đệ quy nên tránh stack overflow với danh sách dài.",
      code: `class Solution {
public:
    ListNode* reverseKGroup(ListNode* head, int k) {
        ListNode dummy(0);
        dummy.next = head;
        ListNode* groupPrev = &dummy;

        while (true) {
            ListNode* kth = groupPrev;
            for (int i = 0; i < k && kth; i++) kth = kth->next;
            if (!kth) break;

            ListNode* groupNext = kth->next;
            ListNode* prev = groupNext;
            ListNode* curr = groupPrev->next;

            while (curr != groupNext) {
                ListNode* tmp = curr->next;
                curr->next = prev;
                prev = curr;
                curr = tmp;
            }

            ListNode* tmp = groupPrev->next;
            groupPrev->next = kth;
            groupPrev = tmp;
        }
        return dummy.next;
    }
};`,
    },
    {
      title: "Đệ quy - dễ hình dung hơn",
      content:
        "Đếm đủ k node, đệ quy xử lý phần còn lại trước, sau đó đảo ngược k node hiện tại rồi nối với kết quả đệ quy.",
      code: `class Solution {
public:
    ListNode* reverseKGroup(ListNode* head, int k) {
        ListNode* node = head;
        int count = 0;
        while (node && count < k) { node = node->next; count++; }
        if (count < k) return head;

        ListNode* newHead = reverseKGroup(node, k);
        ListNode* curr = head;
        ListNode* prev = newHead;
        for (int i = 0; i < k; i++) {
            ListNode* tmp = curr->next;
            curr->next = prev;
            prev = curr;
            curr = tmp;
        }
        return prev;
    }
};`,
    },
  ],

  "101-remove-duplicates-from-sorted-array": [
    {
      title: "Two Pointers O(n), không dùng thêm bộ nhớ",
      content:
        "Dùng con trỏ slow đánh dấu vị trí ghi, con trỏ fast duyệt qua mảng, chỉ ghi đè khi gặp giá trị mới khác slow.",
      code: `class Solution {
public:
    int removeDuplicates(vector<int>& nums) {
        if (nums.empty()) return 0;
        int slow = 0;
        for (int fast = 1; fast < (int)nums.size(); fast++) {
            if (nums[fast] != nums[slow]) {
                slow++;
                nums[slow] = nums[fast];
            }
        }
        return slow + 1;
    }
};`,
    },
  ],

  "102-remove-element": [
    {
      title: "Two Pointers, đổi chỗ phần tử cần xóa ra cuối",
      content:
        "Duyệt mảng, chỉ giữ lại các phần tử khác val bằng cách ghi đè vào vị trí k rồi tăng dần k.",
      code: `class Solution {
public:
    int removeElement(vector<int>& nums, int val) {
        int k = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (nums[i] != val) {
                nums[k] = nums[i];
                k++;
            }
        }
        return k;
    }
};`,
    },
  ],

  "103-find-the-index-of-the-first-occurrence-in-a-string": [
    {
      title: "Duyệt trực tiếp O(n*m), đủ nhanh với ràng buộc đề bài",
      content:
        "Thử khớp needle tại từng vị trí bắt đầu trong haystack, dừng ngay khi tìm thấy vị trí khớp hoàn toàn.",
      code: `class Solution {
public:
    int strStr(string haystack, string needle) {
        int n = haystack.size(), m = needle.size();
        if (m == 0) return 0;
        for (int i = 0; i + m <= n; i++) {
            int j = 0;
            while (j < m && haystack[i + j] == needle[j]) j++;
            if (j == m) return i;
        }
        return -1;
    }
};`,
    },
    {
      title: "KMP - O(n+m), tối ưu hơn cho chuỗi dài",
      content:
        "Xây bảng lps (longest prefix suffix) cho needle trước, sau đó duyệt haystack một lần duy nhất mà không cần quay lui.",
      code: `class Solution {
public:
    int strStr(string haystack, string needle) {
        int n = haystack.size(), m = needle.size();
        if (m == 0) return 0;
        vector<int> lps(m, 0);
        for (int i = 1, len = 0; i < m; ) {
            if (needle[i] == needle[len]) lps[i++] = ++len;
            else if (len) len = lps[len - 1];
            else lps[i++] = 0;
        }
        for (int i = 0, j = 0; i < n; ) {
            if (haystack[i] == needle[j]) { i++; j++; }
            if (j == m) return i - j;
            else if (i < n && haystack[i] != needle[j]) {
                if (j) j = lps[j - 1];
                else i++;
            }
        }
        return -1;
    }
};`,
    },
  ],

  "104-divide-two-integers": [
    {
      title: "Trừ dần bằng dịch bit (bit shifting)",
      content:
        "Không dùng phép chia/nhân trực tiếp: nhân đôi số chia bằng dịch bit đến khi vượt quá số bị chia, rồi trừ dần và cộng dồn kết quả.",
      code: `class Solution {
public:
    int divide(int dividend, int divisor) {
        if (dividend == INT_MIN && divisor == -1) return INT_MAX;
        long long a = abs((long long)dividend);
        long long b = abs((long long)divisor);
        bool neg = (dividend < 0) != (divisor < 0);

        long long result = 0;
        while (a >= b) {
            long long temp = b, multiple = 1;
            while (a >= (temp << 1)) {
                temp <<= 1;
                multiple <<= 1;
            }
            a -= temp;
            result += multiple;
        }
        return neg ? -result : result;
    }
};`,
    },
  ],

  "105-substring-with-concatenation-of-all-words": [
    {
      title: "Sliding Window theo độ dài từ + HashMap đếm tần suất",
      content:
        "Với mỗi vị trí bắt đầu, cắt chuỗi thành các đoạn có độ dài bằng 1 từ trong words rồi so khớp tần suất với hashmap đếm sẵn.",
      code: `class Solution {
public:
    vector<int> findSubstring(string s, vector<string>& words) {
        vector<int> result;
        if (words.empty()) return result;
        int wordLen = words[0].size();
        int numWords = words.size();
        int totalLen = wordLen * numWords;
        if ((int)s.size() < totalLen) return result;

        unordered_map<string, int> wordCount;
        for (auto& w : words) wordCount[w]++;

        for (int i = 0; i + totalLen <= (int)s.size(); i++) {
            unordered_map<string, int> seen;
            int j = 0;
            for (; j < numWords; j++) {
                string word = s.substr(i + j * wordLen, wordLen);
                if (wordCount.find(word) == wordCount.end()) break;
                seen[word]++;
                if (seen[word] > wordCount[word]) break;
            }
            if (j == numWords) result.push_back(i);
        }
        return result;
    }
};`,
    },
  ],

  "106-next-permutation": [
    {
      title: "Thuật toán chuẩn: tìm điểm gãy từ phải sang trái",
      content:
        "Tìm vị trí i đầu tiên từ phải sang mà nums[i] < nums[i+1], tìm phần tử nhỏ nhất lớn hơn nums[i] ở bên phải để swap, rồi đảo ngược phần đuôi.",
      code: `class Solution {
public:
    void nextPermutation(vector<int>& nums) {
        int n = nums.size();
        int i = n - 2;
        while (i >= 0 && nums[i] >= nums[i + 1]) i--;

        if (i >= 0) {
            int j = n - 1;
            while (nums[j] <= nums[i]) j--;
            swap(nums[i], nums[j]);
        }
        reverse(nums.begin() + i + 1, nums.end());
    }
};`,
    },
  ],

  "107-longest-valid-parentheses": [
    {
      title: "Dùng Stack lưu chỉ số",
      content:
        "Đẩy chỉ số dấu '(' vào stack, khi gặp ')' thì pop; nếu stack rỗng thì đẩy chỉ số hiện tại làm mốc, ngược lại cập nhật độ dài lớn nhất.",
      code: `class Solution {
public:
    int longestValidParentheses(string s) {
        stack<int> st;
        st.push(-1);
        int maxLen = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            if (s[i] == '(') {
                st.push(i);
            } else {
                st.pop();
                if (st.empty()) st.push(i);
                else maxLen = max(maxLen, i - st.top());
            }
        }
        return maxLen;
    }
};`,
    },
    {
      title: "Dynamic Programming O(n)",
      content:
        "dp[i] là độ dài chuỗi ngoặc hợp lệ kết thúc tại i. Xét 2 trường hợp: '()' liền nhau, hoặc '))' nối tiếp một đoạn hợp lệ trước đó.",
      code: `class Solution {
public:
    int longestValidParentheses(string s) {
        int n = s.size();
        vector<int> dp(n, 0);
        int maxLen = 0;
        for (int i = 1; i < n; i++) {
            if (s[i] == ')') {
                if (s[i - 1] == '(') {
                    dp[i] = (i >= 2 ? dp[i - 2] : 0) + 2;
                } else if (i - dp[i - 1] - 1 >= 0 && s[i - dp[i - 1] - 1] == '(') {
                    dp[i] = dp[i - 1] + 2 + (i - dp[i - 1] - 2 >= 0 ? dp[i - dp[i - 1] - 2] : 0);
                }
                maxLen = max(maxLen, dp[i]);
            }
        }
        return maxLen;
    }
};`,
    },
  ],

  "108-search-in-rotated-sorted-array": [
    {
      title: "Binary Search có điều chỉnh theo nửa đã sắp xếp",
      content:
        "Tại mỗi bước, luôn có ít nhất một nửa mảng còn sắp xếp đúng thứ tự; kiểm tra target có nằm trong nửa đó không để thu hẹp phạm vi tìm kiếm.",
      code: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0, right = nums.size() - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;

            if (nums[left] <= nums[mid]) {
                if (nums[left] <= target && target < nums[mid]) right = mid - 1;
                else left = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[right]) left = mid + 1;
                else right = mid - 1;
            }
        }
        return -1;
    }
};`,
    },
  ],

  "109-find-first-and-last-position-of-element-in-sorted-array": [
    {
      title: "Hai lần Binary Search tìm biên trái/phải",
      content:
        "Tìm lower_bound(target) làm biên trái, tìm lower_bound(target+1) - 1 làm biên phải. Nếu biên trái không hợp lệ thì trả về [-1,-1].",
      code: `class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {
        int left = lowerBound(nums, target);
        if (left == (int)nums.size() || nums[left] != target) return {-1, -1};
        int right = lowerBound(nums, target + 1) - 1;
        return {left, right};
    }

private:
    int lowerBound(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};`,
    },
  ],

  "110-search-insert-position": [
    {
      title: "Binary Search chuẩn (lower_bound)",
      content:
        "Tìm vị trí đầu tiên mà nums[mid] >= target bằng binary search — đó chính là vị trí cần chèn nếu không tìm thấy target.",
      code: `class Solution {
public:
    int searchInsert(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};`,
    },
  ],

  "111-valid-sudoku": [
    {
      title: "Dùng mảng bool đánh dấu row/col/box đã xuất hiện",
      content:
        "Duyệt qua từng ô, với mỗi số đã điền kiểm tra xem đã xuất hiện ở hàng, cột, hoặc ô vuông 3x3 tương ứng chưa.",
      code: `class Solution {
public:
    bool isValidSudoku(vector<vector<char>>& board) {
        bool rows[9][9] = {false};
        bool cols[9][9] = {false};
        bool boxes[9][9] = {false};

        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                if (board[r][c] == '.') continue;
                int num = board[r][c] - '1';
                int boxIdx = (r / 3) * 3 + c / 3;
                if (rows[r][num] || cols[c][num] || boxes[boxIdx][num]) return false;
                rows[r][num] = cols[c][num] = boxes[boxIdx][num] = true;
            }
        }
        return true;
    }
};`,
    },
  ],

  "112-sudoku-solver": [
    {
      title: "Backtracking thử từng số 1-9 cho ô trống",
      content:
        "Với mỗi ô trống, thử lần lượt các số 1-9 hợp lệ (không trùng hàng/cột/khối), đệ quy tiếp; nếu bế tắc thì quay lui.",
      code: `class Solution {
public:
    void solveSudoku(vector<vector<char>>& board) {
        solve(board);
    }

private:
    bool solve(vector<vector<char>>& board) {
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                if (board[r][c] != '.') continue;
                for (char num = '1'; num <= '9'; num++) {
                    if (isValid(board, r, c, num)) {
                        board[r][c] = num;
                        if (solve(board)) return true;
                        board[r][c] = '.';
                    }
                }
                return false;
            }
        }
        return true;
    }

    bool isValid(vector<vector<char>>& board, int r, int c, char num) {
        for (int i = 0; i < 9; i++) {
            if (board[r][i] == num) return false;
            if (board[i][c] == num) return false;
            if (board[3 * (r / 3) + i / 3][3 * (c / 3) + i % 3] == num) return false;
        }
        return true;
    }
};`,
    },
  ],

  "113-count-and-say": [
    {
      title: "Xây dựng chuỗi qua từng bước bằng đếm ký tự liên tiếp",
      content:
        "Từ chuỗi \"1\" ban đầu, lặp n-1 lần, mỗi lần đếm số ký tự giống nhau liên tiếp rồi ghép \"số lần + ký tự\" để tạo chuỗi kế tiếp.",
      code: `class Solution {
public:
    string countAndSay(int n) {
        string result = "1";
        for (int i = 1; i < n; i++) {
            string next = "";
            int j = 0;
            while (j < (int)result.size()) {
                int count = 1;
                while (j + 1 < (int)result.size() && result[j] == result[j + 1]) {
                    count++;
                    j++;
                }
                next += to_string(count) + result[j];
                j++;
            }
            result = next;
        }
        return result;
    }
};`,
    },
  ],

  "114-combination-sum": [
    {
      title: "Backtracking cho phép dùng lại phần tử",
      content:
        "Sắp xếp mảng trước để cắt tỉa sớm. Ở mỗi bước thử thêm candidates[i], cho phép chọn lại chính i ở lần đệ quy sau vì không giới hạn số lần dùng.",
      code: `class Solution {
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        vector<vector<int>> result;
        vector<int> current;
        sort(candidates.begin(), candidates.end());
        backtrack(candidates, target, 0, current, result);
        return result;
    }

private:
    void backtrack(vector<int>& candidates, int remain, int start,
                    vector<int>& current, vector<vector<int>>& result) {
        if (remain == 0) {
            result.push_back(current);
            return;
        }
        for (int i = start; i < (int)candidates.size(); i++) {
            if (candidates[i] > remain) break;
            current.push_back(candidates[i]);
            backtrack(candidates, remain - candidates[i], i, current, result);
            current.pop_back();
        }
    }
};`,
    },
  ],

  "115-combination-sum-ii": [
    {
      title: "Backtracking, sắp xếp trước rồi bỏ qua trùng lặp ở cùng cấp",
      content:
        "Mỗi phần tử chỉ dùng đúng 1 lần (đệ quy với i+1). Sau khi sắp xếp, bỏ qua các phần tử giống hệt phần tử trước đó ở cùng cấp đệ quy để tránh trùng kết quả.",
      code: `class Solution {
public:
    vector<vector<int>> combinationSum2(vector<int>& candidates, int target) {
        vector<vector<int>> result;
        vector<int> current;
        sort(candidates.begin(), candidates.end());
        backtrack(candidates, target, 0, current, result);
        return result;
    }

private:
    void backtrack(vector<int>& candidates, int remain, int start,
                    vector<int>& current, vector<vector<int>>& result) {
        if (remain == 0) {
            result.push_back(current);
            return;
        }
        for (int i = start; i < (int)candidates.size(); i++) {
            if (i > start && candidates[i] == candidates[i - 1]) continue;
            if (candidates[i] > remain) break;
            current.push_back(candidates[i]);
            backtrack(candidates, remain - candidates[i], i + 1, current, result);
            current.pop_back();
        }
    }
};`,
    },
  ],

  "116-first-missing-positive": [
    {
      title: "Cyclic Sort - đưa từng số về đúng vị trí index, O(n) O(1)",
      content:
        "Đưa mỗi số dương nums[i] trong khoảng [1..n] về đúng vị trí index nums[i]-1 bằng swap tại chỗ, sau đó duyệt lại tìm vị trí đầu tiên sai.",
      code: `class Solution {
public:
    int firstMissingPositive(vector<int>& nums) {
        int n = nums.size();
        for (int i = 0; i < n; i++) {
            while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
                swap(nums[i], nums[nums[i] - 1]);
            }
        }
        for (int i = 0; i < n; i++) {
            if (nums[i] != i + 1) return i + 1;
        }
        return n + 1;
    }
};`,
    },
  ],

  "117-trapping-rain-water": [
    {
      title: "Two Pointers với leftMax/rightMax, O(n) O(1)",
      content:
        "Duyệt từ 2 đầu vào giữa, luôn xử lý bên có chiều cao thấp hơn vì lượng nước tại đó chỉ phụ thuộc vào leftMax/rightMax đã biết chắc chắn.",
      code: `class Solution {
public:
    int trap(vector<int>& height) {
        int left = 0, right = height.size() - 1;
        int leftMax = 0, rightMax = 0;
        int water = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                leftMax = max(leftMax, height[left]);
                water += leftMax - height[left];
                left++;
            } else {
                rightMax = max(rightMax, height[right]);
                water += rightMax - height[right];
                right--;
            }
        }
        return water;
    }
};`,
    },
  ],

  "118-multiply-strings": [
    {
      title: "Nhân từng chữ số như trên giấy, cộng dồn vào mảng kết quả",
      content:
        "Vị trí chữ số i trong num1 nhân với vị trí j trong num2 sẽ đóng góp vào vị trí i+j và i+j+1 của mảng kết quả, xử lý carry sau khi nhân xong.",
      code: `class Solution {
public:
    string multiply(string num1, string num2) {
        if (num1 == "0" || num2 == "0") return "0";
        int n = num1.size(), m = num2.size();
        vector<int> result(n + m, 0);

        for (int i = n - 1; i >= 0; i--) {
            for (int j = m - 1; j >= 0; j--) {
                int mul = (num1[i] - '0') * (num2[j] - '0');
                int p1 = i + j, p2 = i + j + 1;
                int sum = mul + result[p2];
                result[p2] = sum % 10;
                result[p1] += sum / 10;
            }
        }

        string res;
        for (int num : result) {
            if (!(res.empty() && num == 0)) res += to_string(num);
        }
        return res.empty() ? "0" : res;
    }
};`,
    },
  ],

  "119-wildcard-matching": [
    {
      title: "Dynamic Programming bảng 2 chiều",
      content:
        "dp[i][j] biểu diễn s[0..i) có khớp với p[0..j) không. '*' có thể khớp chuỗi rỗng (dp[i][j-1]) hoặc khớp thêm 1 ký tự (dp[i-1][j]).",
      code: `class Solution {
public:
    bool isMatch(string s, string p) {
        int n = s.size(), m = p.size();
        vector<vector<bool>> dp(n + 1, vector<bool>(m + 1, false));
        dp[0][0] = true;

        for (int j = 1; j <= m; j++) {
            if (p[j - 1] == '*') dp[0][j] = dp[0][j - 1];
        }

        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                if (p[j - 1] == '*') {
                    dp[i][j] = dp[i - 1][j] || dp[i][j - 1];
                } else if (p[j - 1] == '?' || s[i - 1] == p[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                }
            }
        }
        return dp[n][m];
    }
};`,
    },
  ],

  "120-jump-game-ii": [
    {
      title: "Greedy - mở rộng tầm nhảy xa nhất theo từng tầng (BFS-like)",
      content:
        "Duyệt qua mảng, luôn cập nhật farthest có thể đi tới. Khi chạm currEnd (giới hạn của bước nhảy hiện tại) thì tăng số bước nhảy lên 1.",
      code: `class Solution {
public:
    int jump(vector<int>& nums) {
        int n = nums.size();
        int jumps = 0, currEnd = 0, farthest = 0;
        for (int i = 0; i < n - 1; i++) {
            farthest = max(farthest, i + nums[i]);
            if (i == currEnd) {
                jumps++;
                currEnd = farthest;
            }
        }
        return jumps;
    }
};`,
    },
  ],

  "121-permutations": [
    {
      title: "Backtracking bằng swap tại chỗ",
      content:
        "Với mỗi vị trí start, lần lượt swap từng phần tử phía sau lên vị trí start rồi đệ quy, sau đó swap lại (undo) để thử phương án khác.",
      code: `class Solution {
public:
    vector<vector<int>> permute(vector<int>& nums) {
        vector<vector<int>> result;
        backtrack(nums, 0, result);
        return result;
    }

private:
    void backtrack(vector<int>& nums, int start, vector<vector<int>>& result) {
        if (start == (int)nums.size()) {
            result.push_back(nums);
            return;
        }
        for (int i = start; i < (int)nums.size(); i++) {
            swap(nums[start], nums[i]);
            backtrack(nums, start + 1, result);
            swap(nums[start], nums[i]);
        }
    }
};`,
    },
  ],

  "122-permutations-ii": [
    {
      title: "Backtracking, sắp xếp trước và đánh dấu used để loại trùng",
      content:
        "Sắp xếp mảng để các phần tử trùng nhau đứng cạnh nhau, chỉ cho phép dùng bản sao tiếp theo khi bản sao trước đã được dùng ở cùng nhánh đệ quy.",
      code: `class Solution {
public:
    vector<vector<int>> permuteUnique(vector<int>& nums) {
        vector<vector<int>> result;
        vector<int> current;
        vector<bool> used(nums.size(), false);
        sort(nums.begin(), nums.end());
        backtrack(nums, used, current, result);
        return result;
    }

private:
    void backtrack(vector<int>& nums, vector<bool>& used,
                    vector<int>& current, vector<vector<int>>& result) {
        if (current.size() == nums.size()) {
            result.push_back(current);
            return;
        }
        for (int i = 0; i < (int)nums.size(); i++) {
            if (used[i]) continue;
            if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1]) continue;
            used[i] = true;
            current.push_back(nums[i]);
            backtrack(nums, used, current, result);
            current.pop_back();
            used[i] = false;
        }
    }
};`,
    },
  ],

  "123-rotate-image": [
    {
      title: "Transpose ma trận rồi lật ngang từng hàng",
      content:
        "Xoay 90 độ = chuyển vị (transpose) ma trận, sau đó đảo ngược thứ tự từng hàng. Làm tại chỗ, không cần mảng phụ.",
      code: `class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {
        int n = matrix.size();
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                swap(matrix[i][j], matrix[j][i]);
            }
        }
        for (int i = 0; i < n; i++) {
            reverse(matrix[i].begin(), matrix[i].end());
        }
    }
};`,
    },
  ],

  "124-group-anagrams": [
    {
      title: "HashMap với key là chuỗi đã sắp xếp",
      content:
        "Các từ là anagram của nhau khi sắp xếp ký tự sẽ cho cùng một chuỗi. Dùng chuỗi đã sắp xếp làm key để gom nhóm trong hashmap.",
      code: `class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> groups;
        for (auto& s : strs) {
            string key = s;
            sort(key.begin(), key.end());
            groups[key].push_back(s);
        }
        vector<vector<string>> result;
        for (auto& entry : groups) {
            result.push_back(entry.second);
        }
        return result;
    }
};`,
    },
  ],

  "125-powx-n": [
    {
      title: "Fast Power - bình phương lặp, O(log n)",
      content:
        "Phân tích số mũ theo cơ số 2: mỗi lần bình phương x và giảm nửa số mũ, nhân dồn kết quả khi bit hiện tại là 1. Xử lý số mũ âm bằng cách nghịch đảo x.",
      code: `class Solution {
public:
    double myPow(double x, int n) {
        long long N = n;
        if (N < 0) {
            x = 1 / x;
            N = -N;
        }
        double result = 1;
        while (N > 0) {
            if (N % 2 == 1) result *= x;
            x *= x;
            N /= 2;
        }
        return result;
    }
};`,
    },
  ],

  "126-n-queens": [
    {
      title: "Backtracking với set đánh dấu cột và 2 đường chéo",
      content:
        "Đặt quân hậu theo từng hàng, dùng 3 mảng bool đánh dấu cột / đường chéo chính / đường chéo phụ đã bị chiếm để kiểm tra O(1) trước khi đặt.",
      code: `class Solution {
public:
    vector<vector<string>> solveNQueens(int n) {
        vector<vector<string>> result;
        vector<string> board(n, string(n, '.'));
        vector<bool> cols(n, false), diag1(2 * n, false), diag2(2 * n, false);
        backtrack(0, n, board, cols, diag1, diag2, result);
        return result;
    }

private:
    void backtrack(int row, int n, vector<string>& board,
                    vector<bool>& cols, vector<bool>& diag1, vector<bool>& diag2,
                    vector<vector<string>>& result) {
        if (row == n) {
            result.push_back(board);
            return;
        }
        for (int col = 0; col < n; col++) {
            int d1 = row + col, d2 = row - col + n;
            if (cols[col] || diag1[d1] || diag2[d2]) continue;

            board[row][col] = 'Q';
            cols[col] = diag1[d1] = diag2[d2] = true;

            backtrack(row + 1, n, board, cols, diag1, diag2, result);

            board[row][col] = '.';
            cols[col] = diag1[d1] = diag2[d2] = false;
        }
    }
};`,
    },
  ],

  "127-n-queens-ii": [
    {
      title: "Backtracking giống N-Queens nhưng chỉ đếm số lời giải",
      content:
        "Cùng logic đặt quân hậu như N-Queens I, nhưng không cần lưu lại bàn cờ — chỉ cần đếm tổng số cách đặt hợp lệ.",
      code: `class Solution {
public:
    int totalNQueens(int n) {
        vector<bool> cols(n, false), diag1(2 * n, false), diag2(2 * n, false);
        return backtrack(0, n, cols, diag1, diag2);
    }

private:
    int backtrack(int row, int n, vector<bool>& cols, vector<bool>& diag1, vector<bool>& diag2) {
        if (row == n) return 1;
        int count = 0;
        for (int col = 0; col < n; col++) {
            int d1 = row + col, d2 = row - col + n;
            if (cols[col] || diag1[d1] || diag2[d2]) continue;
            cols[col] = diag1[d1] = diag2[d2] = true;
            count += backtrack(row + 1, n, cols, diag1, diag2);
            cols[col] = diag1[d1] = diag2[d2] = false;
        }
        return count;
    }
};`,
    },
  ],

  "128-maximum-subarray": [
    {
      title: "Kadane's Algorithm O(n)",
      content:
        "Tại mỗi vị trí, quyết định nối tiếp dãy con hiện tại hay bắt đầu dãy con mới từ phần tử hiện tại, tùy vào cái nào cho tổng lớn hơn.",
      code: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int maxSum = nums[0];
        int currSum = nums[0];
        for (int i = 1; i < (int)nums.size(); i++) {
            currSum = max(nums[i], currSum + nums[i]);
            maxSum = max(maxSum, currSum);
        }
        return maxSum;
    }
};`,
    },
    {
      title: "Chia để trị (Divide and Conquer)",
      content:
        "Chia mảng làm 2 nửa, đệ quy tìm max subarray của từng nửa, rồi tìm thêm dãy con bắc cầu qua điểm giữa. Kết quả là max của 3 giá trị này.",
      code: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        return solve(nums, 0, nums.size() - 1);
    }

private:
    int solve(vector<int>& nums, int left, int right) {
        if (left == right) return nums[left];
        int mid = left + (right - left) / 2;
        int leftMax = solve(nums, left, mid);
        int rightMax = solve(nums, mid + 1, right);

        int leftCross = nums[mid], sum = 0;
        for (int i = mid; i >= left; i--) {
            sum += nums[i];
            leftCross = max(leftCross, sum);
        }
        int rightCross = nums[mid + 1];
        sum = 0;
        for (int i = mid + 1; i <= right; i++) {
            sum += nums[i];
            rightCross = max(rightCross, sum);
        }
        return max({leftMax, rightMax, leftCross + rightCross});
    }
};`,
    },
  ],

  "129-spiral-matrix": [
    {
      title: "Duyệt theo 4 biên top/bottom/left/right, thu hẹp dần",
      content:
        "Duyệt lần lượt: hàng trên (trái->phải), cột phải (trên->dưới), hàng dưới (phải->trái), cột trái (dưới->trên), rồi thu hẹp biên vào trong và lặp lại.",
      code: `class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        vector<int> result;
        if (matrix.empty()) return result;
        int top = 0, bottom = matrix.size() - 1;
        int left = 0, right = matrix[0].size() - 1;

        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) result.push_back(matrix[top][c]);
            top++;
            for (int r = top; r <= bottom; r++) result.push_back(matrix[r][right]);
            right--;
            if (top <= bottom) {
                for (int c = right; c >= left; c--) result.push_back(matrix[bottom][c]);
                bottom--;
            }
            if (left <= right) {
                for (int r = bottom; r >= top; r--) result.push_back(matrix[r][left]);
                left++;
            }
        }
        return result;
    }
};`,
    },
  ],
};

module.exports = { SOLUTIONS };
