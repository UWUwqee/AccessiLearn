# Security Specification: AccessiLearn LMS for SEN Learners

## 1. Data Invariants
1. **Learner Integrity**: A learner profile document can only be created by the authenticated owner (`request.auth.uid == learnerId`). PII like `email` is strictly protected.
2. **Evaluation Ownership**: Each accessibility assessment and UX evaluation must have `learner_id == request.auth.uid`. A student cannot submit evaluations impersonating another student.
3. **Submission Integrity**: Submissions can only be written by the student submitting the work (`learner_id == request.auth.uid`), or updated by the student before graded; once graded, only teachers/admins can modify grades and feedback.
4. **Direct Communication**: Messages must have `sender_id == request.auth.uid` and recipients must be valid participants or the student themselves.
5. **No Blanket Reads**: Public or authenticated users cannot scrape other learners' private assessment logs or draft submissions.
6. **Immutable Fields**: `createdAt`, `learner_id`, `submitted_at` must not be tampered with during updates.
7. **Size & Schema Limits**: Text fields have strict `.size()` limits (e.g. max 3000 chars for responses, max 1000 chars for feedback) to protect against resource exhaustion attacks.

## 2. The "Dirty Dozen" Malicious Payloads (Must be REJECTED)
1. **Unauthenticated Profile Creation**: Anonymous or null auth creating a profile in `/learners/{learnerId}`.
2. **Learner ID Spoofing**: User A creating a learner record with `id: "userB"` where `request.auth.uid != "userB"`.
3. **Arbitrary Field Injection ("Shadow Update")**: Injecting `isAdmin: true` or `role: "admin"` into a learner profile.
4. **Oversized String Bomb**: Submitting a feedback text with 2MB payload exceeding `.size() <= 1000`.
5. **Malicious UX Rating Injection**: Submitting an out-of-bounds rating like `ease_of_use: 99` or `ease_of_use: -5`.
6. **Impersonated Evaluation Submission**: Submitting an evaluation where `learner_id: "victim123"` while `request.auth.uid: "attacker456"`.
7. **Grade Tampering by Student**: Student updating their own submission to modify `score: 100` and `status: "graded"`.
8. **Forged Message Sender**: Sending a message in `/messages/{msgId}` with `sender_id: "teacher_admin"` when sender is not the teacher.
9. **Blanket Query Scraping**: Attempting an unrestricted `list` query across all private learner profiles without ownership filter.
10. **Immutable Timestamp Mutation**: Tampering with `createdAt` during an evaluation or learner update.
11. **Path Variable Poisoning**: Accessing `/learners/{id}` with a 500-character malicious path parameter.
12. **Tampering with LMS Feature Definitions**: Non-admin student attempting to delete or overwrite baseline LMS feature criteria `/lms_features/A1`.

## 3. Test Runner Specification
`firestore.rules.test.ts` validates that unauthenticated users, identity spoofers, shadow-key payloads, and grade tampering payloads return `PERMISSION_DENIED`.
