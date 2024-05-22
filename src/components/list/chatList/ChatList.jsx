import { useEffect, useState } from 'react';
import './chatList.css';
import AddUser from './addUser/AddUser';
import { useUserStore } from '../../../lib/userStore';
import { doc, getDoc, onSnapshot, updateDoc } from '@firebase/firestore';
import { db } from '../../../lib/firebase';
import { useChatStore } from '../../../lib/chatStore';

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [addMode, setAddMode] = useState(false);

    const { chatId, currentUser } = useUserStore();
    const { changeChat } = useChatStore();

    useEffect(() => {
        const unSub = onSnapshot(
            doc(db, 'userchats', currentUser.id),
            async (res) => {
                const items = res.data().chats;

                const promisses = items.map(async (item) => {
                    const userDocRef = doc(db, 'users', item.receiverId);
                    const userDocSnap = await getDoc(userDocRef);

                    const user = userDocSnap.data();

                    return { ...item, user };
                });

                const chatData = await Promise.all(promisses);

                setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
            }
        );

        return () => {
            unSub();
        };
    }, [currentUser.id]);

    const handleSelect = async (chat) => {
        const userChats = chats.map((item) => {
            const { user, ...rest } = item;
            return rest;
        });

        const chatIndex = userChats.findIndex(
            (item) => item.chatId === chat.chatId
        );
        userChats[chatIndex].isSeen = true;

        const userChatsRef = doc(db, 'userchats', currentUser.id);

        try {
            await updateDoc(userChatsRef, {
                chats: userChats,
            });
            changeChat(chat.chatId, chat.user);
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className='chatList'>
            <div className='search'>
                <div className='searchBar'>
                    <img
                        src='./search.png'
                        alt=''
                    />
                    <input
                        type='text'
                        placeholder='Search'
                    />
                </div>
                <img
                    className='add'
                    src={addMode ? './minus.png' : './plus.png'}
                    alt=''
                    onClick={() => setAddMode((prev) => !prev)}
                />
            </div>
            {chats.map((chat) => (
                <div
                    className='item'
                    key={chat.chatId}
                    onClick={() => handleSelect(chat)}
                    style={{
                        backgroundColor: chat?.isSeen
                            ? 'transparent'
                            : '5183fe',
                    }}
                >
                    <img
                        src={chat.user.avatar | './avatar.png'}
                        alt=''
                    />
                    <div className='texts'>
                        <span>{chat.user.username}</span>
                        <p>{chat.lastMessage}</p>
                    </div>
                </div>
            ))}

            {addMode && <AddUser />}
        </div>
    );
};

export default ChatList;
