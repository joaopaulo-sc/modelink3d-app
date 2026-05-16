import io
from datetime import datetime, timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT


def generate_invoice_pdf(order) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=15*mm, rightMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm)
    styles = getSampleStyleSheet()
    bold = ParagraphStyle("bold", parent=styles["Normal"], fontName="Helvetica-Bold")
    center = ParagraphStyle("center", parent=styles["Normal"], alignment=TA_CENTER)
    right = ParagraphStyle("right", parent=styles["Normal"], alignment=TA_RIGHT)
    normal = styles["Normal"]
    white_bold = ParagraphStyle("white_bold", parent=styles["Normal"], fontName="Helvetica-Bold", textColor=colors.white)

    elements = []

    elements.append(Paragraph("ModelInk3D", ParagraphStyle("title", parent=styles["Title"], fontSize=20)))
    elements.append(Paragraph("Recibo de Pedido", center))
    elements.append(Spacer(1, 8*mm))

    info = [
        ["Pedido #", str(order.id), "Data", datetime.now(timezone.utc).strftime("%d/%m/%Y")],
        ["Prazo", order.deadline.strftime("%d/%m/%Y") if order.deadline else "-", "Status", order.status.value],
    ]
    t = Table(info, colWidths=[30*mm, 60*mm, 30*mm, 60*mm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f5f5f5")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 6*mm))

    if order.client:
        elements.append(Paragraph("Cliente", bold))
        elements.append(Paragraph(order.client.name, styles["Normal"]))
        if order.client.whatsapp:
            elements.append(Paragraph(f"WhatsApp: {order.client.whatsapp}", styles["Normal"]))
        elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph("Detalhes do Serviço", bold))
    service_data = [[
        Paragraph("Descrição", white_bold),
        Paragraph("Qtd", white_bold),
        Paragraph("Valor Unit.", white_bold),
        Paragraph("Subtotal", white_bold),
    ]]

    items_to_show = getattr(order, "items", None) or []
    if items_to_show:
        for item in items_to_show:
            subtotal = (item.unit_price or 0) * item.quantity
            service_data.append([
                Paragraph(item.item_name, normal),
                Paragraph(str(item.quantity), normal),
                Paragraph(f"R$ {item.unit_price:.2f}" if item.unit_price else "—", right),
                Paragraph(f"R$ {subtotal:.2f}" if item.unit_price else "—", right),
            ])
    else:
        service_data.append([
            Paragraph(order.item_name or "—", normal),
            Paragraph("1", normal),
            Paragraph(f"R$ {order.sell_price or 0:.2f}", right),
            Paragraph(f"R$ {order.sell_price or 0:.2f}", right),
        ])

    for es in order.extra_services:
        name = es.extra_service.name if es.extra_service else f"Serviço #{es.extra_service_id}"
        service_data.append([
            Paragraph(name, normal),
            Paragraph("1", normal),
            Paragraph(f"R$ {es.price:.2f}", right),
            Paragraph(f"R$ {es.price:.2f}", right),
        ])

    t2 = Table(service_data, colWidths=[75*mm, 20*mm, 40*mm, 45*mm])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 6*mm))

    total = order.sell_price or 0
    sinal = order.down_payment or 0
    restante = total - sinal
    fin_data = [
        ["Total", f"R$ {total:.2f}"],
        ["Sinal Pago", f"R$ {sinal:.2f}"],
        ["Restante a Pagar", f"R$ {restante:.2f}"],
    ]
    t3 = Table(fin_data, colWidths=[130*mm, 50*mm])
    t3.setStyle(TableStyle([
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, -1), (-1, -1), 12),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t3)

    doc.build(elements)
    return buffer.getvalue()
