const  {registerTeamUser, registerSoloUser, chatBotPayment, generatePaymentLink} = require("../controller/User");

const Router = require("express") 




const router = Router();

router.post("/registerTeamUser", registerTeamUser)
router.post("/registerSoloUser", registerSoloUser)
router.get("/chatBotPayment", chatBotPayment)
router.post("/generatePaymentLink", generatePaymentLink)



module.exports = router