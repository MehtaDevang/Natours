const express = require('express');

const userController = require('../controllers/userController');
const authController = require("../controllers/authController");



const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.use(authController.protect);                      // protects all the routes the come after this line
router.get('/me', userController.getMe, userController.getUser);
router.patch("/updatePassword", authController.updatePassword);
router.patch("/updateMe", userController.uploadUserPhoto, userController.updateMe);
router.delete("/deleteMe", userController.deleteMe);

router.use(authController.restrictTo("admin"));

router
.route("/")
.get(userController.getAllUsers)
.post(userController.createUser)

router
.route("/:id")
.get(userController.getUser)
.patch(userController.updateUser)
.delete(userController.deleteUser)

module.exports = router;