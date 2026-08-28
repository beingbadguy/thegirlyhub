import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

if (mongoose.models.Contact) {
  delete mongoose.models.Contact;
}

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
