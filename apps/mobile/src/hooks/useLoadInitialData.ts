import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AssistantActions, ChatActions } from '@bgos/shared-state';
import { fetchAssistantsWithChats } from '@bgos/shared-services';

export const useLoadInitialData = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.currentUser);
  const token = useSelector((state: RootState) => state.user.token);
  const assistants = useSelector((state: RootState) => state.assistants.list);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !token) return;

      try {
        dispatch(AssistantActions.setLoading(true));
        dispatch(ChatActions.setLoading(true));

        const data = await fetchAssistantsWithChats(user.id, token);

        dispatch(AssistantActions.setAssistants(data.assistants));
        dispatch(ChatActions.setChats(data.chats));
      } catch (error) {
        console.error('Failed to load initial data:', error);
        dispatch(AssistantActions.setError('Failed to load assistants'));
        dispatch(ChatActions.setError('Failed to load chats'));
      }
    };

    loadData();
  }, [user?.id, token, dispatch]);

  return { assistants };
};
