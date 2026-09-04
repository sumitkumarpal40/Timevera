import re
with open('src/lib/orderService.ts', 'r') as f:
    content = f.read()

content = content.replace('''  } catch (error: any) {
    console.error("Order Transaction Failed: ", error);
    throw error;
  }
} catch (error) {
    console.warn('Firestore sync notice (order safely saved locally):', error);
  }
}''', '''  } catch (error: any) {
    console.error("Order Transaction Failed: ", error);
    throw error;
  }
}''')

with open('src/lib/orderService.ts', 'w') as f:
    f.write(content)
