/* eslint-disable @typescript-eslint/no-require-imports */
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const addTwoNumbersData = {
  id: "2-add-two-numbers",
  title: "Add Two Numbers",
  difficulty: "Medium",
  acceptance: 0.42, //
  tags: ["linked-list", "math", "recursion"], //
  constraints: [
    "Số lượng node trong mỗi danh sách liên kết nằm trong khoảng [1, 100].",
    "0 <= Node.val <= 9",
    "Đảm bảo rằng danh sách không có số 0 dẫn đầu, ngoại trừ chính số 0.",
  ], //
  description:
    "Bạn được cho hai danh sách liên kết không trống đại diện cho hai số nguyên không âm. Các chữ số được lưu trữ theo thứ tự đảo ngược, và mỗi node của chúng chứa một chữ số duy nhất. Hãy cộng hai số này và trả về kết quả dưới dạng một danh sách liên kết.", //

  defaultCode: {
    cpp: "class Solution {\npublic:\n    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {\n        \n    }\n};",
    java: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 * int val;
 * ListNode next;
 * ListNode() {}
 * ListNode(int val) { this.val = val; }
 * ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        
    }
}`,
    python: `from typing import Optional

# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        `,
    javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 * this.val = (val===undefined ? 0 : val)
 * this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
var addTwoNumbers = function(l1, l2) {
    
};`,
  }, //

  driverCodes: {
    cpp: `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

// __USER_CODE_HERE__

// Hàm phụ trợ: Chuyển chuỗi "2 4 3" thành ListNode*
ListNode* stringToList(string s) {
    stringstream ss(s);
    int n;
    ListNode* dummy = new ListNode(0);
    ListNode* curr = dummy;
    while (ss >> n) {
        curr->next = new ListNode(n);
        curr = curr->next;
    }
    return dummy->next;
}

// Hàm phụ trợ: Chuyển ListNode* thành chuỗi "708" để so sánh
void printList(ListNode* head) {
    while (head) {
        cout << head->val;
        head = head->next;
    }
}

int main() {
    string line1, line2;
    if (!getline(cin, line1) || !getline(cin, line2)) return 0;

    ListNode* l1 = stringToList(line1);
    ListNode* l2 = stringToList(line2);

    Solution sol;
    ListNode* result = sol.addTwoNumbers(l1, l2);
    printList(result);
    return 0;
}`,
    python: `
import sys
from typing import Optional  # THÊM DÒNG NÀY ĐỂ HẾT LỖI NAMEERROR

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# Placeholder cho Piston ghép code người dùng
# # __USER_CODE_HERE__

def create_list(s: str) -> Optional[ListNode]:
    if not s or not s.strip(): return None
    try:
        nums = list(map(int, s.split()))
        if not nums: return None
        dummy = ListNode(0)
        curr = dummy
        for n in nums:
            curr.next = ListNode(n)
            curr = curr.next
        return dummy.next
    except:
        return None

if __name__ == "__main__":
    # Đọc tất cả input từ stdin
    input_data = sys.stdin.read().splitlines()
    if len(input_data) < 2:
        sys.exit(0)
    
    l1 = create_list(input_data[0])
    l2 = create_list(input_data[1])
    
    sol = Solution()
    result = sol.addTwoNumbers(l1, l2)
    
    # Xuất kết quả dạng chuỗi liền nhau (vd: 708)
    output = ""
    while result:
        output += str(result.val)
        result = result.next
    sys.stdout.write(output)
`,
    java: `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        ListNode l1 = stringToList(sc.nextLine());
        if (!sc.hasNextLine()) return;
        ListNode l2 = stringToList(sc.nextLine());

        // Gọi code của người dùng
        Solution sol = new Solution();
        ListNode res = sol.addTwoNumbers(l1, l2);
        
        StringBuilder output = new StringBuilder();
        while (res != null) {
            output.append(res.val);
            res = res.next;
        }
        System.out.print(output.toString());
    }

    public static ListNode stringToList(String s) {
        if (s == null || s.trim().isEmpty()) return null;
        String[] parts = s.trim().split("\\\\s+");
        ListNode dummy = new ListNode(0);
        ListNode curr = dummy;
        for (String p : parts) {
            curr.next = new ListNode(Integer.parseInt(p));
            curr = curr.next;
        }
        return dummy.next;
    }
}

// Định nghĩa cấu trúc dữ liệu bên dưới class Main
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

// Piston sẽ chèn mã của người dùng (class Solution) vào đây.
// __USER_CODE_HERE__
`,
    javascript: `
const fs = require('fs');

function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}

// Định nghĩa class Solution sẵn để tránh lỗi Scope nếu người dùng chỉ viết hàm var
class Solution {}

// Piston sẽ chèn mã của người dùng vào đây. 
// Nếu người dùng viết "var addTwoNumbers = ...", nó sẽ nằm ở phạm vi global này.
// __USER_CODE_HERE__

function createList(s) {
    if (!s || s.trim() === "") return null;
    const nums = s.trim().split(/\\s+/).map(Number);
    let dummy = new ListNode(0);
    let curr = dummy;
    for (let n of nums) {
        if (!isNaN(n)) {
            curr.next = new ListNode(n);
            curr = curr.next;
        }
    }
    return dummy.next;
}

// Đọc input từ stdin (Piston truyền test case vào đây)
const input = fs.readFileSync(0, 'utf8').split('\\n');
const l1 = createList(input[0]);
const l2 = createList(input[1]);

// Xử lý linh hoạt: Ưu tiên gọi function global, nếu không có thì gọi phương thức của Solution
const sol = new Solution();
const addFn = (typeof addTwoNumbers === 'function') ? addTwoNumbers : sol.addTwoNumbers;

if (typeof addFn === 'function') {
    let result = addFn(l1, l2);
    let output = "";
    while (result) {
        output += result.val;
        result = result.next;
    }
    process.stdout.write(output);
} else {
    console.error("Error: addTwoNumbers function not found.");
}
`,
  }, //

  examples: [
    {
      input: "l1 = [2,4,3], l2 = [5,6,4]",
      output: "[7,0,8]",
      explanation: "342 + 465 = 807.",
    },
  ], //

  editorial: {
    approaches: [
      {
        name: "Elementary Math",
        description:
          "Duyệt qua cả hai danh sách, cộng các giá trị tương ứng cùng với biến nhớ (carry).",
        timeComplexity: "O(max(m, n))",
        spaceComplexity: "O(max(m, n))",
        code: {
          cpp: `class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode* dummyHead = new ListNode(0);
        ListNode* curr = dummyHead;
        int carry = 0;
        while (l1 != NULL || l2 != NULL || carry != 0) {
            int x = l1 ? l1->val : 0;
            int y = l2 ? l2->val : 0;
            int sum = carry + x + y;
            carry = sum / 10;
            curr->next = new ListNode(sum % 10);
            curr = curr->next;
            l1 = l1 ? l1->next : nullptr;
            l2 = l2 ? l2->next : nullptr;
        }
        ListNode* result = dummyHead->next;
        delete dummyHead;  // Freeing the memory allocated for dummyHead
        return result;
    }
};`,
          java: `public ListNode resList = new ListNode(0);
public ListNode head = resList;
public int carry = 0;

public ListNode addTwoNumbers(ListNode l1, ListNode l2) { 
    int sum = l1.val + l2.val + carry;
    carry  = sum / 10;
    resList.next = new ListNode(sum % 10);
    resList = resList.next;

    if(l1.next != null && l2.next != null)
        addTwoNumbers(l1.next, l2.next);  
    else if (l1.next != null)
        addTwoNumbers(l1.next, new ListNode(0)); 
    else if (l2.next != null)
        addTwoNumbers(new ListNode(0), l2.next);   
    else if (carry > 0)
    {
        resList.next = new ListNode(1);
        resList = resList.next;
    }     
    return head.next;
}`,
          javascript: `var addTwoNumbers = function(l1, l2) {
    
    let sum = 0;
    let current = new ListNode(0);
    let result = current;
    
    while(l1 || l2) {
        
        if(l1) {
            sum += l1.val;
            l1 = l1.next;
        }
        
        if(l2) {
            sum += l2.val;
            l2 = l2.next;
        }
        
        current.next = new ListNode(sum % 10);
        current = current.next;
        
        sum = sum > 9 ? 1 : 0;
    }
    
    if(sum) {
        current.next = new ListNode(sum);
    }
    
    return result.next;
};`,
          python: `class Solution:
    def addTwoNumbers(
        self, l1: Optional[ListNode], l2: Optional[ListNode]
    ) -> Optional[ListNode]:
        dummyHead = ListNode(0)
        curr = dummyHead
        carry = 0
        while l1 != None or l2 != None or carry != 0:
            l1Val = l1.val if l1 else 0
            l2Val = l2.val if l2 else 0
            columnSum = l1Val + l2Val + carry
            carry = columnSum // 10
            newNode = ListNode(columnSum % 10)
            curr.next = newNode
            curr = newNode
            l1 = l1.next if l1 else None
            l2 = l2.next if l2 else None
        return dummyHead.next`,
        },
      },
    ],
    videoUrl: "https://www.youtube.com/watch?v=wgFPrzTjm7s",
    lastUpdated: new Date(),
    content:
      "Để giải bài toán này, ta có thể dùng phương pháp duyệt qua cả hai danh sách đồng thời, cộng các giá trị tương ứng cùng với biến nhớ (carry) từ phép cộng trước đó.",
  }, //
};

const testCases = [
  { input: "2 4 3\n5 6 4", expected: "708", isHidden: false },
  { input: "0\n0", expected: "0", isHidden: false },
  { input: "9 9 9 9 9 9 9\n9 9 9 9", expected: "89990001", isHidden: true },
]; //

async function pushAddTwoNumbers() {
  const problemRef = db.collection("problems").doc(addTwoNumbersData.id);
  await problemRef.set({
    ...addTwoNumbersData,
    likes: [],
    stars: [],
    dislikes: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const tcBatch = db.batch();
  testCases.forEach((tc, i) => {
    const ref = problemRef.collection("testCases").doc(`testCase${i + 1}`);
    tcBatch.set(ref, tc);
  });
  await tcBatch.commit();
  console.log("✅ Đã push bài Add Two Numbers thành công!");
}

pushAddTwoNumbers().then(() => process.exit());
