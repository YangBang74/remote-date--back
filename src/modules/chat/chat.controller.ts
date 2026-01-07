import { Request, Response } from "express";
import { chatService } from "./chat.service";

export const ChatController = {
  async getRoomMessages(req: Request, res: Response) {
    const room = req.params.room;
    const messages = await chatService.getMessages(room);
    res.json(messages);
  }
};
