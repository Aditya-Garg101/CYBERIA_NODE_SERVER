const  {registerTeamUser, registerSoloUser, chatBotPayment} = require("../controller/User");

const Router = require("express") 




const router = Router();

router.post("/registerTeamUser", registerTeamUser)
router.post("/registerSoloUser", registerSoloUser)
router.get("/chatBotPayment", chatBotPayment)



module.exports = router