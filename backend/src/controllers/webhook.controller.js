import { getChatServer } from "../config/streamConfig.js";


export const handleStreamWebhook = async (req, res) => {
    try {
        
        

        const { type, user, message, channel } = req.body;

        console.log(`📥 Stream Webhook Event: ${type}`);

        
        switch (type) {
            case 'user.created':
                console.log(`👤 New user created: ${user?.id}`);
                break;

            case 'message.new':
                console.log(`💬 New message in channel ${channel?.id}: ${message?.text?.substring(0, 50)}...`);
                break;

            case 'channel.created':
                console.log(`#️⃣ New channel created: ${channel?.id}`);
                break;

            default:
                console.log(`🔄 Other event: ${type}`);
        }

        
        res.status(200).json({ received: true });
    } catch (error) {
        console.error("Error handling Stream webhook:", error.message);
        res.status(500).json({ error: "Failed to process webhook" });
    }
};


export const handlePresendMessageHook = async (req, res) => {
    try {
        const { message } = req.body;

        console.log(`📝 Processing message: ${message?.text?.substring(0, 50)}...`);

        
        const profanityWords = ['badword1', 'badword2']; 
        const messageText = message?.text?.toLowerCase() || '';

        const containsProfanity = profanityWords.some(word => messageText.includes(word));

        if (containsProfanity) {
            return res.status(400).json({
                accepted: false,
                message: "Message contains inappropriate content"
            });
        }

        
        const enrichedMessage = {
            ...message,
            metadata: {
                processed_at: new Date().toISOString(),
                word_count: messageText.split(' ').length
            }
        };

        res.status(200).json({
            accepted: true,
            message: enrichedMessage
        });
    } catch (error) {
        console.error("Error handling presend message hook:", error.message);
        res.status(500).json({ error: "Failed to process message" });
    }
};