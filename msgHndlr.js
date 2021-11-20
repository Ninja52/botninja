const { decryptMedia } = require('@open-wa/wa-decrypt')
const fs = require('fs-extra')
const axios = require('axios')
const moment = require('moment-timezone')
const get = require('got')
const fetch = require('node-fetch')
const color = require('./lib/color')
const { spawn, exec } = require('child_process')
const { API } = require('nhentai-api')
const { liriklagu, quotemaker, randomNimek, fb, sleep, jadwalTv, ss } = require('./lib/functions')
const { help, snk, info, readme } = require('./lib/help')
const { stdout } = require('process')
const nsfw_ = JSON.parse(fs.readFileSync('./lib/NSFW.json'))
const welkom = JSON.parse(fs.readFileSync('./lib/welcome.json'))
const { removeBackgroundFromImageBase64 } = require('remove.bg')

moment.tz.setDefault('Asia/Jakarta').locale('id')

module.exports = msgHandler = async (client, message) => {
    try {
        const { type, id, from, t, sender, isGroupMsg, chat, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
        let { body } = message
        const { name, formattedTitle } = chat
        let { pushname, verifiedName } = sender
        pushname = pushname || verifiedName
        const commands = caption || body || ''
        const command = commands.toLowerCase().split(' ')[0] || ''
        const args =  commands.split(' ')

        const msgs = (message) => {
            if (command.startsWith('!')) {
                if (message.length >= 10){
                    return `${message.substr(0, 15)}`
                }else{
                    return `${message}`
                }
            }
        }

        const mess = {
            wait: '[ ESPERE ] Em andamento⏳ por favor, aguarde um momento',
            error: {
                St: '[❗] Envie uma imagem com a legenda *!sticker * ou marque a imagem que foi enviada',
                Qm: '[❗] Ocorreu um erro, talvez o tema não esteja disponível!',
                Yt3: '[❗] Ocorreu um erro, não é possível converter para mp3!',
                Yt4: '[❗] Ocorreu um erro, talvez o erro tenha sido causado pelo sistema.',
                Ki: '[❗] O bot não pode remover o grupo de administração!',
                Ad: '[❗] Não é possível adicionar destino, talvez porque seja privado',
                Iv: '[❗] O link que você enviou não é válido!'
            }
        }
        const apiKey = 'API-KEY' // apikey you can get it at https://mhankbarbar.moe
        const time = moment(t * 1000).format('DD/MM HH:mm:ss')
        const botNumber = await client.getHostNumber()
        const blockNumber = await client.getBlockedIds()
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        const groupAdmins = isGroupMsg ? await client.getGroupAdmins(groupId) : ''
        const isGroupAdmins = isGroupMsg ? groupAdmins.includes(sender.id) : false
        const isBotGroupAdmins = isGroupMsg ? groupAdmins.includes(botNumber + '@c.us') : false
        const ownerNumber = ["5511986754658@c.us","5511986754658"] // replace with your whatsapp number
        const isOwner = ownerNumber.includes(sender.id)
        const isBlocked = blockNumber.includes(sender.id)
        const uaOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
        const isUrl = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi)
        if (!isGroupMsg && command.startsWith('!')) console.log('\x1b[1;31m~\x1b[1;37m>', '[\x1b[1;32mEXEC\x1b[1;37m]', time, color(msgs(command)), 'from', color(pushname))
        if (isGroupMsg && command.startsWith('!')) console.log('\x1b[1;31m~\x1b[1;37m>', '[\x1b[1;32mEXEC\x1b[1;37m]', time, color(msgs(command)), 'from', color(pushname), 'in', color(formattedTitle))
        //if (!isGroupMsg && !command.startsWith('!')) console.log('\x1b[1;33m~\x1b[1;37m>', '[\x1b[1;31mMSG\x1b[1;37m]', time, color(body), 'from', color(pushname))
        //if (isGroupMsg && !command.startsWith('!')) console.log('\x1b[1;33m~\x1b[1;37m>', '[\x1b[1;31mMSG\x1b[1;37m]', time, color(body), 'from', color(pushname), 'in', color(formattedTitle))
        if (isBlocked) return
        //if (!isOwner) return
        switch(command) {
        case '!sticker':
        case '!stiker':
            if (isMedia && type === 'image') {
                const mediaData = await decryptMedia(message, uaOverride)
                const imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                await client.sendImageAsSticker(from, imageBase64)
            } else if (quotedMsg && quotedMsg.type == 'image') {
                const mediaData = await decryptMedia(quotedMsg, uaOverride)
                const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
                await client.sendImageAsSticker(from, imageBase64)
            } else if (args.length === 2) {
                const url = args[1]
                if (url.match(isUrl)) {
                    await client.sendStickerfromUrl(from, url, { method: 'get' })
                        .catch(err => console.log('Exceção capturada: ', err))
                } else {
                    client.reply(from, mess.error.Iv, id)
                }
            } else {
                    client.reply(from, mess.error.St, id)
            }
            break
        case '!stickergif':
        case '!stikergif':
        case '!sgif':
            if (isMedia) {
                if (mimetype === 'video/mp4' && message.duration < 10 || mimetype === 'image/gif' && message.duration < 10) {
                    const mediaData = await decryptMedia(message, uaOverride)
                    client.reply(from, '[ESPERAR] Em andamento ⏳ Aguarde ± 1 min!', id)
                    const filename = `./media/aswu.${mimetype.split('/')[1]}`
                    await fs.writeFileSync(filename, mediaData)
                    await exec(`gify ${filename} ./media/output.gif --fps=30 --scale=240:240`, async function (error, stdout, stderr) {
                        const gif = await fs.readFileSync('./media/output.gif', { encoding: "base64" })
                        await client.sendImageAsSticker(from, `data:image/gif;base64,${gif.toString('base64')}`)
                    })
                } else (
                    client.reply(from, '[❗] Envie o vídeo com a legenda *!stickergif * máx. 10 segundos!', id)
                )
            }
            break
	    case '!stickernobg':
        case '!stikernobg':
	    if (isMedia) {
                try {
                    var mediaData = await decryptMedia(message, uaOverride)
                    var imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                    var base64img = imageBase64
                    var outFile = './media/img/noBg.png'
                    // untuk api key kalian bisa dapatkan pada website remove.bg
                    var result = await removeBackgroundFromImageBase64({ base64img, apiKey: 'API-KEY', size: 'auto', type: 'auto', outFile })
                    await fs.writeFile(outFile, result.base64img)
                    await client.sendImageAsSticker(from, `data:${mimetype};base64,${result.base64img}`)
                } catch(err) {
                    console.log(err)
                }
            }
            break
        case '!ytmp3':
            if (args.length === 1) return client.reply(from, 'Envie o comando *!ytmp3 [linkYt]*')
            let isLinks = args[1].match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/)
            if (!isLinks) return client.reply(from, mess.error.Iv, id)
            try {
                client.reply(from, mess.wait, id)
                const resp = await get.get(`https://mhankbarbar.moe/api/yta?url=${args[1]}&apiKey=${apiKey}`).json()
                if (resp.error) {
                    client.reply(from, resp.error, id)
                } else {
                    const { title, thumb, filesize, result } = await resp
                    if (Number(filesize.split(' MB')[0]) >= 30.00) return client.reply(from, 'A duração do vídeo excedeu o limite máximo!', id)
                    client.sendFileFromUrl(from, thumb, 'thumb.jpg', `➸ *Título* : ${title}\n➸ *Tamanho do arquivo* : ${filesize}\n\nAguarde um momento, o processo de envio do arquivo leva alguns minutos.`, id)
                    await client.sendFileFromUrl(from, result, `${title}.mp3`, '', id).catch(() => client.reply(from, mess.error.Yt3, id))
                    //await client.sendAudio(from, result, id)
                }
            } catch (err) {
                client.sendText(ownerNumber[0], 'Error ytmp3 : '+ err)
                client.reply(from, mess.error.Yt3, id)
            }
            break
        case '!ytmp4':
            if (args.length === 1) return client.reply(from, 'Envie o comando *!ytmp4 [linkYt]*')
            let isLin = args[1].match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/)
            if (!isLin) return client.reply(from, mess.error.Iv, id)
            try {
                client.reply(from, mess.wait, id)
                const ytv = await get.get(`https://mhankbarbar.moe/api/ytv?url=${args[1]}&apiKey=${apiKey}`).json()
                if (ytv.error) {
                    client.reply(from, ytv.error, id)
                } else {
                    if (Number(ytv.filesize.split(' MB')[0]) > 40.00) return client.reply(from, 'A duração do vídeo excedeu o limite máximo!', id)
                    client.sendFileFromUrl(from, ytv.thumb, 'thumb.jpg', `➸ *Título* : ${ytv.title}\n➸ *Tamanho do arquivo* : ${ytv.filesize}\n\nAguarde um momento, o processo de envio do arquivo leva alguns minutos.`, id)
                    await client.sendFileFromUrl(from, ytv.result, `${ytv.title}.mp4`, '', id).catch(() => client.reply(from, mess.error.Yt4, id))
                }
            } catch (er) {
                client.sendText(ownerNumber[0], 'Erro: '+ er)
                client.reply(from, mess.error.Yt4, id)
            }
            break
        case '!wiki':
            if (args.length === 1) return client.reply(from, 'Enviar comando *!wiki [consulta] * \nExemplo: *!wiki teste*', id)
            const query_ = body.slice(6)
            const wiki = await get.get(`https://mhankbarbar.moe/api/wiki?q=${query_}&lang=id&apiKey=${apiKey}`).json()
            if (wiki.error) {
                client.reply(from, wiki.error, id)
            } else {
                client.reply(from, `➸ *Consulta* : ${query_}\n\n➸ *Resultado* : ${wiki.result}`, id)
            }
            break
        case '!creator':
                client.sendContact(from, '5511986754658@c.us')
                break
                case '!fb':
                    if (args.length === 1) return client.reply(from, 'Enviar pedido *!fb [linkFb]*', id)
                    if (!args[1].includes('facebook.com')) return client.reply(from, mess.error.Iv, id)
                    client.reply(from, mess.wait, id)
                    const epbe = await get.get(`https://mhankbarbars.moe/api/epbe?url=${args[1]}&apiKey=${apiKey}`).json()
                    if (epbe.error) return client.reply(from, epbe.error, id)
                    client.sendFileFromUrl(from, epbe.result, 'epbe.mp4', epbe.title, id)
                    break
        case '!ig':
            if (args.length === 1) return client.reply(from, 'Enviar pedido *!ig [linkIg]*')
            if (!args[1].match(isUrl) && !args[1].includes('instagram.com')) return client.reply(from, mess.error.Iv, id)
            try {
                client.reply(from, mess.wait, id)
                const resp = await get.get(`https://mhankbarbar.moe/api/ig?url=${args[1]}&apiKey=${apiKey}`).json()
                if (resp.result.includes('.mp4')) {
                    var ext = '.mp4'
                } else {
                    var ext = '.jpg'
                }
                await client.sendFileFromUrl(from, resp.result, `igeh${ext}`, '', id)
            } catch {
                client.reply(from, mess.error.Ig, id)
                }
            break
            case '!join':
                if (args.length < 2) return client.reply(from, 'Enviar pedidos *!join link do grupo*\n\nEx:\n!join https://chat.whatsapp.com/blablablablablabla', id)
                const link = args[1]
                const tGr = await client.getAllGroups()
                const isLink = link.match(/(https:\/\/chat.whatsapp.com)/gi)
                const check = await client.inviteInfo(link)
                if (!isLink) return client.reply(from, 'Este é o link? 👊🤬', id)
                if (tGr.length > 30) return client.reply(from, 'Desculpe, o número de grupos está esgotado!', id)
                if (check.status === 200) {
                    await client.joinGroupViaLink(link).then(() => client.reply(from, 'O bot entrará em breve!'))
                } else {
                    client.reply(from, 'Link de grupo inválido!', id)
                }
                break
        case '!welcome':
            if (!isGroupMsg) return client.reply(from, 'Este comando só pode ser usado em grupos!', id)
            if (!isGroupAdmins) return client.reply(from, 'Este comando só pode ser usado pelo grupo Admin!', id)
            if (args.length === 1) return client.reply(from, 'Selecione habilitar ou desabilitar!', id)
            if (args[1].toLowerCase() === 'habilitar') {
                welkom.push(chat.id)
                fs.writeFileSync('./lib/welcome.json', JSON.stringify(welkom))
                client.reply(from, 'O recurso de boas-vindas foi ativado com sucesso neste grupo!', id)
            } else if (args[1].toLowerCase() === 'desabilitar') {
                welkom.splice(chat.id, 1)
                fs.writeFileSync('./lib/welcome.json', JSON.stringify(welkom))
                client.reply(from, 'O recurso de boas-vindas foi desativado com sucesso neste grupo!', id)
            } else {
                client.reply(from, 'Selecione habilitar ou desabilitar!', id)
            }
        case '!brainly':
            if (args.length >= 2){
                const BrainlySearch = require('./lib/brainly')
                let tanya = body.slice(9)
                let jum = Number(tanya.split('.')[1]) || 2
                if (jum > 10) return client.reply(from, 'Max 10!', id)
                if (Number(tanya[tanya.length-1])){
                    tanya
                }
                client.reply(from, `➸ *Pergunta* : ${tanya.split('.')[0]}\n\n➸ *Número de respostas* : ${Number(jum)}`, id)
                await BrainlySearch(tanya.split('.')[0],Number(jum), function(res){
                    res.forEach(x=>{
                        if (x.jawaban.fotoJawaban.length == 0) {
                            client.reply(from, `➸ *Pergunta* : ${x.pertanyaan}\n\n➸ *Resposta* : ${x.jawaban.judulJawaban}\n`, id)
                        } else {
                            client.reply(from, `➸ *Pergunta* : ${x.pertanyaan}\n\n➸ *Resposta* : ${x.jawaban.judulJawaban}\n\n➸ *Responda com link da foto* : ${x.jawaban.fotoJawaban.join('\n')}`, id)
                        }
                    })
                })
            } else {
                client.reply(from, 'Usage :\n!brainly [pergunta] [.jumlah]\n\nEx : \n!brainly NKRI .2', id)
            }
            break
        case '!linkgroup':
            if (!isBotGroupAdmins) return client.reply(from, 'Este comando só pode ser usado quando o bot se torna administrador', id)
            if (isGroupMsg) {
                const inviteLink = await client.getGroupInviteLink(groupId);
                client.sendLinkWithAutoPreview(from, inviteLink, `\nLink group *${name}*`)
            } else {
            	client.reply(from, 'Este comando só pode ser usado em grupos!', id)
            }
            break
        case '!bc':
            if (!isOwner) return client.reply(from, 'Este comando é apenas para o proprietário do bot!', id)
            let msg = body.slice(4)
            const chatz = await client.getAllChatIds()
            for (let ids of chatz) {
                var cvk = await client.getChatById(ids)
                if (!cvk.isReadOnly) await client.sendText(ids, `[ NINJA BOT ]\n\n${msg}`)
            }
            client.reply(from, 'Broadcast Success!', id)
            break
        case '!adminlist':
            if (!isGroupMsg) return client.reply(from, 'Este comando só pode ser usado em grupos!', id)
            let mimin = ''
            for (let admon of groupAdmins) {
                mimin += `➸ @${admon.replace(/@c.us/g, '')}\n` 
            }
            await client.sendTextWithMentions(from, mimin)
            break
        case '!ownergroup':
            if (!isGroupMsg) return client.reply(from, 'Este comando só pode ser usado em grupos!', id)
            const Owner_ = chat.groupMetadata.owner
            await client.sendTextWithMentions(from, `Dono do grupo : @${Owner_}`)
            break
        case '!mentionall':
            if (!isGroupMsg) return client.reply(from, 'Perintah ini hanya bisa di gunakan dalam group!', id)
            if (!isGroupAdmins) return client.reply(from, 'Perintah ini hanya bisa di gunakan oleh admin group', id)
            const groupMem = await client.getGroupMembers(groupId)
            let hehe = '╔══✪〘 Mention All 〙✪══\n'
            for (let i = 0; i < groupMem.length; i++) {
                hehe += '╠➥'
                hehe += ` @${groupMem[i].id.replace(/@c.us/g, '')}\n`
            }
            hehe += '╚═〘 NINJA BOT 〙'
            await client.sendTextWithMentions(from, hehe)
            break
        case '!kickall':
            if (!isGroupMsg) return client.reply(from, 'Este comando só pode ser usado em grupos!', id)
            const isGroupOwner = sender.id === chat.groupMetadata.owner
            if (!isGroupOwner) return client.reply(from, 'Este comando só pode ser usado pelo grupo Proprietário', id)
            if (!isBotGroupAdmins) return client.reply(from, 'Este comando só pode ser usado quando o bot se torna administrador', id)
            const allMem = await client.getGroupMembers(groupId)
            for (let i = 0; i < allMem.length; i++) {
                if (groupAdmins.includes(allMem[i].id)) {
                    console.log('Ops, este é o grupo de administradores')
                } else {
                    await client.removeParticipant(groupId, allMem[i].id)
                }
            }
            client.reply(from, 'Kick com sucesso para todos os membros', id)
            break
        case '!leaveall':
            if (!isOwner) return client.reply(from, 'Este comando é apenas para o bot do proprietário', id)
            const allChats = await client.getAllChatIds()
            const allGroups = await client.getAllGroups()
            for (let gclist of allGroups) {
                await client.sendText(gclist.contact.id, `O bot esta limpando, o bate-papo total ativo: ${allChats.length}`)
                await client.leaveGroup(gclist.contact.id)
            }
            client.reply(from, 'Sucesso em deixar todo os grupos!', id)
            break
        case '!clearall':
            if (!isOwner) return client.reply(from, 'Este comando é apenas para o proprietário do bot.', id)
            const allChatz = await client.getAllChats()
            for (let dchat of allChatz) {
                await client.deleteChat(dchat.id)
            }
            client.reply(from, 'Sucesso, limpei todo o chat!', id)
            break
        case '!add':
            const orang = args[1]
            if (!isGroupMsg) return client.reply(from, 'Este recurso só pode ser usado em grupos', id)
            if (args.length === 1) return client.reply(from, 'Para usar este recurso, envie o comando *!add* 628xxxxx', id)
            if (!isGroupAdmins) return client.reply(from, 'Este recurso só pode ser usado por administradores de grupo', id)
            if (!isBotGroupAdmins) return client.reply(from, 'Este recurso só pode ser usado quando o bot é um administrador', id)
            try {
                await client.addParticipant(from,`${orang}@c.us`)
            } catch {
                client.reply(from, mess.error.Ad, id)
            }
            break
        case '!kick':
            if (!isGroupMsg) return client.reply(from, 'Este recurso só pode ser usado em grupos', id)
            if (!isGroupAdmins) return client.reply(from, 'Este recurso só pode ser usado por administradores de grupo', id)
            if (!isBotGroupAdmins) return client.reply(from, 'Este recurso só pode ser usado quando o bot é um administrador', id)
            if (mentionedJidList.length === 0) return client.reply(from, 'Para usar este recurso, envie o comando *!kick* @usuario', id)
            await client.sendText(from, `Pedido recebido, problema:\n${mentionedJidList.join('\n')}`)
            for (let i = 0; i < mentionedJidList.length; i++) {
                if (groupAdmins.includes(mentionedJidList[i])) return client.reply(from, mess.error.Ki, id)
                await client.removeParticipant(groupId, mentionedJidList[i])
            }
            break
        case '!leave':
            if (!isGroupMsg) return client.reply(from, 'Este recurso só pode ser usado em grupos', id)
            if (!isGroupAdmins) return client.reply(from, 'Este recurso só pode ser usado por administradores de grupo', id)
            await client.sendText(from,'Sayonara').then(() => client.leaveGroup(groupId))
            break
        case '!promote':
            if (!isGroupMsg) return client.reply(from, 'Este recurso só pode ser usado em grupos', id)
            if (!isGroupAdmins) return client.reply(from, 'Este recurso só pode ser usado por administradores de grupo', id)
            if (!isBotGroupAdmins) return client.reply(from, 'Este recurso só pode ser usado quando o bot é um administrador', id)
            if (mentionedJidList.length === 0) return client.reply(from, 'Para usar este recurso, envie o comando *!promote* @usuario', id)
            if (mentionedJidList.length >= 2) return client.reply(from, 'Desculpe, este comando só pode ser usado por 1 pessoa.', id)
            if (groupAdmins.includes(mentionedJidList[0])) return client.reply(from, 'Desculpe, o usuário já é um administrador.', id)
            await client.promoteParticipant(groupId, mentionedJidList[0])
            await client.sendTextWithMentions(from, `Pedido aceito, @${mentionedJidList[0]} adicionado como admin.`)
            break
        case '!demote':
            if (!isGroupMsg) return client.reply(from, 'Este recurso só pode ser usado em grupos', id)
            if (!isGroupAdmins) return client.reply(from, 'Este recurso só pode ser usado por administradores de grupo', id)
            if (!isBotGroupAdmins) return client.reply(from, 'Este recurso só pode ser usado quando o bot é um administrador', id)
            if (mentionedJidList.length === 0) return client.reply(from, 'Para usar este recurso, envie o comando *!demote* @usuario', id)
            if (mentionedJidList.length >= 2) return client.reply(from, 'Desculpe, este comando só pode ser usado por 1 pessoa.', id)
            if (!groupAdmins.includes(mentionedJidList[0])) return client.reply(from, 'Desculpe, esse usuário não é um administrador.', id)
            await client.demoteParticipant(groupId, mentionedJidList[0])
            await client.sendTextWithMentions(from, `Pedido recebido, excluir trabalho @${mentionedJidList[0]}.`)
            break
        case '!delete':
            if (!isGroupMsg) return client.reply(from, 'Este recurso só pode ser usado em grupos', id)
            if (!isGroupAdmins) return client.reply(from, 'Este recurso só pode ser usado por administradores de grupo', id)
            if (!quotedMsg) return client.reply(from, 'Errado!!, envie o comando *!delete [mensagem do bot] *', id)
            if (!quotedMsgObj.fromMe) return client.reply(from, 'Errado!!, o bot não pode excluir o bate-papo de outro usuário!', id)
            client.deleteMessage(quotedMsgObj.chatId, quotedMsgObj.id, false)
            break
        case '!listblock':
            let hih = `Esta é uma lista de números bloqueados\nTotal : ${blockNumber.length}\n`
            for (let i of blockNumber) {
                hih += `➸ @${i.replace(/@c.us/g,'')}\n`
            }
        case '!loli':
            const loli = await get.get(`https://mhankbarbar.tech/api/randomloli?apiKey=${apiKey}`).json()
            client.sendFileFromUrl(from, loli.result, 'loli.jpeg', 'Lolinya om', id)
            break
        /*case '!sendto':
            client.sendFile(from, './msgHndlr.js', 'msgHndlr.js')
            break*/
        case '!url2img':
            const _query = body.slice(9)
            if (!_query.match(isUrl)) return client.reply(from, mess.error.Iv, id)
            if (args.length === 1) return client.reply(from, 'Enviar pedidos *!url2img [web]*\nExemplo *!url2img https://google.com*', id)
            const url2img = await get.get(`https://mhankbarbar.moe/api/url2image?url=${_query}&tipe=mobile&apiKey=${apiKey}`).json()
            if (url2img.error) return client.reply(from, url2img.error, id)
            client.sendFileFromUrl(from, url2img.result, 'kyaa.jpg', null, id)
            break
        case '!help':
            client.sendText(from, help)
            break
        case '!info':
            client.sendLinkWithAutoPreview(from, 'https://github.com/mhankbarbar/whatsapp-bot', info)
            break
        case '!snk':
            client.reply(from, snk, id)
            break
        }
    } catch (err) {
        console.log(color('[ERROR]', 'red'), err)
        //client.kill().then(a => console.log(a))
    }
}
