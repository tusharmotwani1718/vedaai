import { NextResponse } from "next/server";
import { generateAssignmentPDF } from "../../../../../../utils/functions/exportPdf";

export const runtime = "nodejs";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {

    const { id } = await params;

    try {

        const pdfBuffer = await generateAssignmentPDF(id);

        return new NextResponse(
            Buffer.from(pdfBuffer),
            {
                headers: {
                    "Content-Type": "application/pdf",

                    "Content-Disposition":
                        `attachment; filename="assignment-${id}.pdf"`,
                },
            }
        );

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to generate PDF",
            },
            {
                status: 500,
            }
        );
    }
}