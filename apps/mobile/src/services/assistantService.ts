import { Assistant } from '@bgos/shared-types';

const BASE_URL = 'https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89';

/**
 * Reorder assistants by updating their display order
 */
export async function reorderAssistants(
  userId: string,
  orders: { id: string; displayOrder: number }[]
): Promise<boolean> {
  const url = `${BASE_URL}/assistants/${userId}/reorder`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ assistantOrders: orders }),
  });

  if (!response.ok) {
    throw new Error(`Failed to reorder assistants: ${response.status} ${response.statusText}`);
  }

  return true;
}
