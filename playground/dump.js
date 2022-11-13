// app.post('/image/:id', verifyUser, async (req, res) => {

//     const inputs = req.body;
//     const replicate = new Replicate({token: process.env.REPLICATE_TOKEN});
//     const stableDiffusion = await replicate.models.get('stability-ai/stable-diffusion');
//     const stableDiffusionPrediction = await stableDiffusion.predict(inputs);
//     res.status(200).send(stableDiffusionPrediction);
// })

//