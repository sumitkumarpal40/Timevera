import re
with open('src/components/PaymentModal.tsx', 'r') as f:
    content = f.read()

bad_block = """    } catch (err: any) {
      console.error("Order failed:", err);
      setFormErrors({ _form: err.message || 'Failed to place order due to server validation.' });
      setIsSubmitting(false);
    }
    } catch (err: any) {
      console.error("Order failed:", err);
      setFormErrors({ _form: err.message || 'Failed to place order due to server validation.' });
      setIsSubmitting(false);
    }"""

good_block = """    } catch (err: any) {
      console.error("Order failed:", err);
      setFormErrors({ _form: err.message || 'Failed to place order due to server validation.' });
      setIsSubmitting(false);
      return;
    }"""

content = content.replace(bad_block, good_block)

# Let's fix line 331, expected `,` error.
# Ah, I replaced "try" but inside `handleSubmitOrder` which was an `const handleSubmitOrder = async (e: React.FormEvent) => { e.preventDefault(); ...`
# Let's check what is at line 331.
