"use client"

import { useState } from "react"
import Form from "@rjsf/core"
import validator from "@rjsf/validator-ajv8"
import { Button } from "@/components/ui/button"
import { Loader2, Play, Sparkles } from "lucide-react"

interface ActorFormProps {
  schema: any // The input schema for the actor
  onSubmit: (formData: any) => void // Function to trigger actor execution
  loading: boolean
}

export function ActorForm({ schema, onSubmit, loading }: ActorFormProps) {
  const [formData, setFormData] = useState({})

  const handleSubmit = ({ formData }: { formData: any }) => {
    onSubmit(formData) // Call the onSubmit prop with the form data
  }

  const handleChange = ({ formData }: { formData: any }) => {
    setFormData(formData)
  }

  // Custom UI schema for better styling
  const uiSchema = {
    "ui:submitButtonOptions": {
      norender: true, // We'll render our own submit button
    },
  }

  // Custom widgets for better integration with shadcn/ui
  const widgets = {}

  return (
    <div className="space-y-6">
      <Form
        schema={schema} // Renders the form based on this schema
        uiSchema={uiSchema}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit} // Form submission triggers handleSubmit
        validator={validator}
        widgets={widgets}
        className="space-y-4"
      >
        <Button
          type="submit"
          className="w-full gradient-button hover:scale-105 transition-all duration-200 text-white font-semibold py-4 text-lg glow-purple"
          disabled={loading}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Executing Actor...
            </>
          ) : (
            <>
              <Play className="mr-3 h-5 w-5" />
              <Sparkles className="mr-2 h-4 w-4" />
              Run Actor
            </>
          )}
        </Button>
      </Form>
    </div>
  )
}
