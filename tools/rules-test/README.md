# Firestore rules test

Checks the rules in `firestore.rules` against the Firebase emulator (31 allow and block cases).

Needs Node and Java 21 or newer.

```
cd tools/rules-test
npm init -y
npm install firebase-tools@15.37.0 @firebase/rules-unit-testing@6.0.0 firebase@13.4.0
copy ..\..\firestore.rules .
echo { "firestore": { "rules": "firestore.rules" }, "emulators": { "firestore": { "port": 8085, "host": "127.0.0.1" } } } > firebase.json
npx firebase emulators:exec --only firestore --project iranti-rules-test "node test.mjs"
```
